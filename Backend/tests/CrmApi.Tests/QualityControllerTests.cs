using CrmApi.Controllers;
using CrmApi.DTOs.Quality;
using CrmApi.Services.Quality;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class QualityControllerTests : ControllerTestBase
{
    private readonly Mock<IQualityService> _mockService;
    private readonly Mock<IQualityDashboardService> _mockDashboard;
    private readonly QualityController _sut;

    public QualityControllerTests()
    {
        _mockService = new Mock<IQualityService>(MockBehavior.Strict);
        _mockDashboard = new Mock<IQualityDashboardService>(MockBehavior.Strict);
        _sut = new QualityController(_mockService.Object, _mockDashboard.Object);
    }

    [Fact]
    public async Task Evaluate_Admin_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var dto = new CreateEvaluationDto { AgentId = 1, GlobalScore = 85 };
        _mockService.Setup(s => s.CreateEvaluationAsync(1, dto)).ReturnsAsync(true);

        var result = await _sut.Evaluate(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Evaluate_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.Evaluate(new CreateEvaluationDto());

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Evaluate_NullBody_ReturnsBadRequest()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");

        var result = await _sut.Evaluate(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetAgentEvaluations_ReturnsEvals()
    {
        var expected = new List<EvaluationDto> { new() { GlobalScore = 80 } };
        _mockService.Setup(s => s.GetAgentEvaluationsAsync(1)).ReturnsAsync(expected);

        var result = await _sut.GetAgentEvaluations(1);

        var val = OkValue<List<EvaluationDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAllEvaluations_Admin_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<EvaluationDto> { new() { GlobalScore = 90 } };
        _mockService.Setup(s => s.GetAllEvaluationsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetAllEvaluations();

        var val = OkValue<List<EvaluationDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAllEvaluations_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.GetAllEvaluations();

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetStats_ReturnsStats()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new QualityStatsDto { Total = 5, AvgScore = 75 };
        _mockService.Setup(s => s.GetStatsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetStats();

        var val = OkValue<QualityStatsDto>(result);
        val.Total.Should().Be(5);
    }

    [Fact]
    public async Task DeleteEvaluation_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteEvaluationAsync(1)).ReturnsAsync(true);

        var result = await _sut.DeleteEvaluation(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteEvaluation_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteEvaluationAsync(999)).ReturnsAsync(false);

        var result = await _sut.DeleteEvaluation(999);

        AssertNotFound(result);
    }

    [Fact]
    public async Task GetTeamStatus_ReturnsStatus()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new TeamStatusCardDto { OnlineCount = 3, TotalAgents = 5 };
        _mockDashboard.Setup(s => s.GetTeamStatusAsync()).ReturnsAsync(expected);

        var result = await _sut.GetTeamStatus();

        var val = OkValue<TeamStatusCardDto>(result);
        val.OnlineCount.Should().Be(3);
    }

    [Fact]
    public async Task GetGlobalStats_ReturnsStats()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new GlobalStatsDto { TotalAgents = 5, AvgQualityScore = 78.5 };
        _mockDashboard.Setup(s => s.GetGlobalStatsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetGlobalStats();

        var val = OkValue<GlobalStatsDto>(result);
        val.AvgQualityScore.Should().Be(78.5);
    }

    [Fact]
    public async Task GetAgentDetail_Existing_ReturnsDetail()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new AgentDetailDto { UserId = 1, Name = "Agent 1" };
        _mockDashboard.Setup(s => s.GetAgentDetailAsync(1)).ReturnsAsync(expected);

        var result = await _sut.GetAgentDetail(1);

        var val = OkValue<AgentDetailDto>(result);
        val.Name.Should().Be("Agent 1");
    }

    [Fact]
    public async Task GetAgentDetail_NonExistent_Returns404()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockDashboard.Setup(s => s.GetAgentDetailAsync(999)).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.GetAgentDetail(999);

        AssertNotFound(result);
    }

    [Fact]
    public async Task GetRdvJour_ReturnsRdv()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new RdvJourDto { TotalToday = 5, Objectif = 30 };
        _mockDashboard.Setup(s => s.GetRdvJourAsync()).ReturnsAsync(expected);

        var result = await _sut.GetRdvJour();

        var val = OkValue<RdvJourDto>(result);
        val.TotalToday.Should().Be(5);
    }
}
