using CrmApi.Controllers;
using CrmApi.DTOs.Quality;
using CrmApi.Services.Quality;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class QualityControllerIntegrationTests : ControllerTestBase
{
    private readonly Mock<IQualityService> _mockService;
    private readonly Mock<IQualityDashboardService> _mockDashService;
    private readonly QualityController _adminController;
    private readonly QualityController _agentController;

    public QualityControllerIntegrationTests()
    {
        _mockService = CreateMockService<IQualityService>();
        _mockDashService = CreateMockService<IQualityDashboardService>();
        _adminController = CreateController(() => new QualityController(_mockService.Object, _mockDashService.Object), role: "admin");
        _agentController = CreateController(() => new QualityController(_mockService.Object, _mockDashService.Object), userId: 2, role: "agent");
    }

    [Fact]
    public async Task Evaluate_Admin_Valid_ReturnsOk()
    {
        var dto = new CreateEvaluationDto { AgentId = 2, GlobalScore = 85, Commentaires = "Good" };
        _mockService.Setup(s => s.CreateEvaluationAsync(1, dto))
            .ReturnsAsync(true);

        var result = await _adminController.Evaluate(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.Value.Should().BeEquivalentTo(new { success = true, message = "Evaluation saved" });
    }

    [Fact]
    public async Task Evaluate_NullDto_Returns400()
    {
        var result = await _adminController.Evaluate(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetAgentEvaluations_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAgentEvaluationsAsync(2))
            .ReturnsAsync(new List<EvaluationDto>());

        var result = await _adminController.GetAgentEvaluations(2);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAllEvaluations_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAllEvaluationsAsync())
            .ReturnsAsync(new List<EvaluationDto>());

        var result = await _adminController.GetAllEvaluations();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        _mockService.Setup(s => s.GetStatsAsync())
            .ReturnsAsync(new QualityStatsDto { Total = 10 });

        var result = await _adminController.GetStats();

        var value = OkValue<QualityStatsDto>(result);
        value.Total.Should().Be(10);
    }

    [Fact]
    public async Task DeleteEvaluation_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.DeleteEvaluationAsync(1)).ReturnsAsync(true);

        var result = await _adminController.DeleteEvaluation(1);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteEvaluation_NotFound_Returns404()
    {
        _mockService.Setup(s => s.DeleteEvaluationAsync(999)).ReturnsAsync(false);

        var result = await _adminController.DeleteEvaluation(999);
        AssertNotFound(result);
    }

    [Fact]
    public async Task GetTeamStatus_Admin_ReturnsOk()
    {
        _mockDashService.Setup(s => s.GetTeamStatusAsync())
            .ReturnsAsync(new TeamStatusCardDto());

        var result = await _adminController.GetTeamStatus();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTeamStatus_Agent_ReturnsForbid()
    {
        var result = await _agentController.GetTeamStatus();
        AssertForbid(result);
    }

    [Fact]
    public async Task GetGlobalStats_Admin_ReturnsOk()
    {
        _mockDashService.Setup(s => s.GetGlobalStatsAsync())
            .ReturnsAsync(new GlobalStatsDto());

        var result = await _adminController.GetGlobalStats();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetEvaluationHistory_Admin_ReturnsOk()
    {
        int limit = 10;
        int offset = 0;
        _mockDashService.Setup(s => s.GetEvaluationHistoryAsync(limit, offset))
            .ReturnsAsync(new List<EvaluationHistoryRowDto>());

        var result = await _adminController.GetEvaluationHistory(limit, offset);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAgentDetail_Admin_ReturnsOk()
    {
        _mockDashService.Setup(s => s.GetAgentDetailAsync(2))
            .ReturnsAsync(new AgentDetailDto());

        var result = await _adminController.GetAgentDetail(2);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetComparison_Admin_ReturnsOk()
    {
        _mockDashService.Setup(s => s.GetComparisonAsync())
            .ReturnsAsync(new DashboardComparisonDto());

        var result = await _adminController.GetComparison();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAgentsState_Admin_ReturnsOk()
    {
        _mockDashService.Setup(s => s.GetAgentsStateAsync())
            .ReturnsAsync(new List<AgentStateRowDto>());

        var result = await _adminController.GetAgentsState();
        Assert.IsType<OkObjectResult>(result);
    }
}
