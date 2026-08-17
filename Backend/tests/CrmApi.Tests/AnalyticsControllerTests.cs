using CrmApi.Controllers;
using CrmApi.DTOs.Analytics;
using CrmApi.Services.Analytics;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AnalyticsControllerTests : ControllerTestBase
{
    private readonly Mock<IAnalyticsService> _mockService;
    private readonly AnalyticsController _sut;

    public AnalyticsControllerTests()
    {
        _mockService = new Mock<IAnalyticsService>(MockBehavior.Strict);
        _sut = new AnalyticsController(_mockService.Object);
    }

    [Fact]
    public async Task GetOverview_Admin_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new OverviewDto { TotalCalls = 100, AvgScore = 75.5 };
        _mockService.Setup(s => s.GetOverviewAsync()).ReturnsAsync(expected);

        var result = await _sut.GetOverview();

        var val = OkValue<OverviewDto>(result);
        val.TotalCalls.Should().Be(100);
    }

    [Fact]
    public async Task GetOverview_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.GetOverview();

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetAgentsPerformance_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<AgentPerformanceDto> { new() { AgentName = "Alice", TotalCalls = 10 } };
        _mockService.Setup(s => s.GetAgentsPerformanceAsync()).ReturnsAsync(expected);

        var result = await _sut.GetAgentsPerformance();

        var val = OkValue<List<AgentPerformanceDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetSupervision_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new SupervisionDto { IncoherenceCount = 3, InactivityCount = 1 };
        _mockService.Setup(s => s.GetSupervisionAsync()).ReturnsAsync(expected);

        var result = await _sut.GetSupervision();

        var val = OkValue<SupervisionDto>(result);
        val.IncoherenceCount.Should().Be(3);
    }

    [Fact]
    public async Task GetGeo_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new GeoDto { TotalLocalized = 5, TopDept = "75" };
        _mockService.Setup(s => s.GetGeoAsync()).ReturnsAsync(expected);

        var result = await _sut.GetGeo();

        var val = OkValue<GeoDto>(result);
        val.TopDept.Should().Be("75");
    }

    [Fact]
    public async Task GetFollowups_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new FollowupStatsDto { Stats = new FollowupSummaryDto { Total = 10 } };
        _mockService.Setup(s => s.GetFollowupsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetFollowups();

        var val = OkValue<FollowupStatsDto>(result);
        val.Stats.Total.Should().Be(10);
    }

    [Fact]
    public async Task GetCallsLog_Admin_ReturnsAll()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<CallsLogDto> { new() { CallId = 1 } };
        _mockService.Setup(s => s.GetCallsLogAsync(200, null)).ReturnsAsync(expected);

        var result = await _sut.GetCallsLog(200);

        var val = OkValue<List<CallsLogDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetCallsLog_Agent_ReturnsFilteredByUser()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 5, username: "agent1", role: "agent");
        var expected = new List<CallsLogDto> { new() { AgentName = "agent1" } };
        _mockService.Setup(s => s.GetCallsLogAsync(200, "agent1")).ReturnsAsync(expected);

        var result = await _sut.GetCallsLog(200);

        var val = OkValue<List<CallsLogDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetComparison_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new ComparisonDto { Day = new ComparisonPeriodDto { Total = 5 } };
        _mockService.Setup(s => s.GetComparisonAsync()).ReturnsAsync(expected);

        var result = await _sut.GetComparison();

        var val = OkValue<ComparisonDto>(result);
        val.Day.Total.Should().Be(5);
    }

    [Fact]
    public async Task GetPointage_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<object> { new { agent = "A1" } };
        _mockService.Setup(s => s.GetPointageAsync()).ReturnsAsync(expected);

        var result = await _sut.GetPointage();

        var val = OkValue<List<object>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetLiveAgents_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<object> { new { name = "A1", status = "active" } };
        _mockService.Setup(s => s.GetLiveAgentsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetLiveAgents();

        var val = OkValue<List<object>>(result);
        val.Should().ContainSingle();
    }
}
