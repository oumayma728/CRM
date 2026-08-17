using CrmApi.Controllers;
using CrmApi.DTOs.Ai;
using CrmApi.Services.Ai;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AiScoringControllerTests : ControllerTestBase
{
    private readonly Mock<IAiService> _mockService;
    private readonly AiScoringController _adminController;
    private readonly AiScoringController _agentController;

    public AiScoringControllerTests()
    {
        _mockService = new Mock<IAiService>(MockBehavior.Strict);
        _adminController = new AiScoringController(_mockService.Object);
        _adminController.ControllerContext = CreateControllerContext(role: "admin");
        _agentController = new AiScoringController(_mockService.Object);
        _agentController.ControllerContext = CreateControllerContext(userId: 2, role: "agent");
    }

    [Fact]
    public async Task Score_ValidDto_ReturnsOk()
    {
        var dto = new EligibilityRequestDto { Revenus = 50000 };
        var expected = new EligibilityResultDto { Score = 75 };
        _mockService.Setup(s => s.ScoreEligibilityAsync(dto)).ReturnsAsync(expected);

        var result = await _adminController.Score(dto);

        var val = OkValue<EligibilityResultDto>(result);
        val.Score.Should().Be(75);
    }

    [Fact]
    public async Task Score_NullDto_ReturnsBadRequest()
    {
        var result = await _adminController.Score(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task Score_ArgumentException_ReturnsBadRequest()
    {
        var dto = new EligibilityRequestDto();
        _mockService.Setup(s => s.ScoreEligibilityAsync(dto)).ThrowsAsync(new ArgumentException("Invalid"));

        var result = await _adminController.Score(dto);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task AnalyzeEligibility_ValidDto_ReturnsOk()
    {
        var dto = new EligibilityRequestDto { Revenus = 50000 };
        var expected = new EligibilityResultDto { Score = 75 };
        _mockService.Setup(s => s.AnalyzeEligibilityAsync(1, dto)).ReturnsAsync(expected);

        var result = await _adminController.AnalyzeEligibility(dto);

        var val = OkValue<EligibilityResultDto>(result);
        val.Score.Should().Be(75);
    }

    [Fact]
    public async Task AnalyzeEligibility_NullDto_ReturnsBadRequest()
    {
        var result = await _adminController.AnalyzeEligibility(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task AnalyzeEligibility_KeyNotFound_ReturnsNotFound()
    {
        var dto = new EligibilityRequestDto();
        _mockService.Setup(s => s.AnalyzeEligibilityAsync(1, dto)).ThrowsAsync(new KeyNotFoundException("Not found"));

        var result = await _adminController.AnalyzeEligibility(dto);
        AssertNotFound(result);
    }

    [Fact]
    public async Task DetectFakeRdv_Agent_ReturnsForbid()
    {
        var result = await _agentController.DetectFakeRdv(new FakeRdvRequestDto());
        AssertForbid(result);
    }

    [Fact]
    public async Task DetectFakeRdv_Admin_ReturnsOk()
    {
        var dto = new FakeRdvRequestDto { ClientPhone = "0102030405" };
        var expected = new FakeRdvResultDto { Verdict = "clean" };
        _mockService.Setup(s => s.DetectFakeRdvAsync(dto)).ReturnsAsync(expected);

        var result = await _adminController.DetectFakeRdv(dto);

        var val = OkValue<FakeRdvResultDto>(result);
        val.Verdict.Should().Be("clean");
    }

    [Fact]
    public async Task DetectFakeRdv_NullDto_ReturnsBadRequest()
    {
        var result = await _adminController.DetectFakeRdv(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetInsights_Valid_ReturnsOk()
    {
        var expected = new AiInsightsDto { CallStats = new CallStatsDto { TotalCalls = 10 } };
        _mockService.Setup(s => s.GetInsightsAsync(1)).ReturnsAsync(expected);

        var result = await _adminController.GetInsights(1);

        var val = OkValue<AiInsightsDto>(result);
        val.CallStats.TotalCalls.Should().Be(10);
    }

    [Fact]
    public async Task GetInsights_KeyNotFound_ReturnsNotFound()
    {
        _mockService.Setup(s => s.GetInsightsAsync(99)).ThrowsAsync(new KeyNotFoundException("Agent not found"));

        var result = await _adminController.GetInsights(99);
        AssertNotFound(result);
    }
}
