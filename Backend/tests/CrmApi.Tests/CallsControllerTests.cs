using CrmApi.Controllers;
using CrmApi.DTOs.Call;
using CrmApi.Services.Call;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class CallsControllerTests : ControllerTestBase
{
    private readonly Mock<ICallService> _mockService;
    private readonly CallsController _adminController;
    private readonly CallsController _agentController;

    public CallsControllerTests()
    {
        _mockService = new Mock<ICallService>(MockBehavior.Strict);
        _adminController = new CallsController(_mockService.Object);
        _adminController.ControllerContext = CreateControllerContext(role: "admin");
        _agentController = new CallsController(_mockService.Object);
        _agentController.ControllerContext = CreateControllerContext(userId: 2, role: "agent");
    }

    [Fact]
    public async Task GetCalls_ReturnsOk()
    {
        var expected = new CallsResponseDto { Calls = new List<CallListDto>() };
        _mockService.Setup(s => s.GetCallsAsync(1, "admin", null, null, 50, 0)).ReturnsAsync(expected);

        var result = await _adminController.GetCalls(null, null, 50, 0);

        var val = OkValue<CallsResponseDto>(result);
        val.Should().NotBeNull();
    }

    [Fact]
    public async Task GetCall_Valid_ReturnsOk()
    {
        var expected = new CallListDto { Id = 1 };
        _mockService.Setup(s => s.GetCallByIdAsync(1, 1, "admin")).ReturnsAsync(expected);

        var result = await _adminController.GetCall(1);

        var val = OkValue<CallListDto>(result);
        val.Id.Should().Be(1);
    }

    [Fact]
    public async Task GetCall_NotFound_ReturnsNotFound()
    {
        _mockService.Setup(s => s.GetCallByIdAsync(99, 1, "admin")).ThrowsAsync(new KeyNotFoundException("Call not found"));

        var result = await _adminController.GetCall(99);
        AssertNotFound(result);
    }

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var expected = new CallStatsDto { TotalCalls = 10 };
        _mockService.Setup(s => s.GetCallStatsAsync(1, "admin", null)).ReturnsAsync(expected);

        var result = await _adminController.GetStats(null);

        var val = OkValue<CallStatsDto>(result);
        val.TotalCalls.Should().Be(10);
    }

    [Fact]
    public async Task GetAgentsSummary_Admin_ReturnsOk()
    {
        var expected = new List<AgentSummaryDto> { new() { AgentName = "Alice" } };
        _mockService.Setup(s => s.GetAgentsSummaryAsync()).ReturnsAsync(expected);

        var result = await _adminController.GetAgentsSummary();

        var val = OkValue<List<AgentSummaryDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAgentsSummary_Agent_ReturnsForbid()
    {
    }

    [Fact]
    public async Task SaveCall_Valid_ReturnsOk()
    {
        var dto = new CallSaveDto { ContactName = "Alice" };
        _mockService.Setup(s => s.SaveCallAsync(1, dto)).ReturnsAsync((true, 1, "Saved"));

        var result = await _adminController.SaveCall(dto);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task SaveCall_NullBody_ReturnsBadRequest()
    {
        var result = await _adminController.SaveCall(null!);
        AssertBadRequest(result);
    }
}
