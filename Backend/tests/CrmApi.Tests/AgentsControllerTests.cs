using CrmApi.Controllers;
using CrmApi.DTOs.Agent;
using CrmApi.Services.Agent;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AgentsControllerTests : ControllerTestBase
{
    private readonly Mock<IAgentService> _mockService;
    private readonly AgentsController _sut;

    public AgentsControllerTests()
    {
        _mockService = new Mock<IAgentService>(MockBehavior.Strict);
        _sut = new AgentsController(_mockService.Object);
    }

    [Fact]
    public async Task GetAgents_Admin_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<AgentSimpleDto> { new() { AgentName = "Agent 1" } };
        _mockService.Setup(s => s.GetAgentsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetAgents();

        var val = OkValue<List<AgentSimpleDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAgents_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.GetAgents();

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetAgentPerformance_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new AgentPerformanceDetailDto { AgentName = "Alice" };
        _mockService.Setup(s => s.GetAgentPerformanceAsync("Alice")).ReturnsAsync(expected);

        var result = await _sut.GetAgentPerformance("Alice");

        var val = OkValue<AgentPerformanceDetailDto>(result);
        val.AgentName.Should().Be("Alice");
    }

    [Fact]
    public async Task GetAgentPerformance_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.GetAgentPerformanceAsync("Ghost")).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.GetAgentPerformance("Ghost");

        AssertNotFound(result);
    }

    [Fact]
    public async Task SaveData_Valid_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var dto = new AgentSaveDto { Notes = "some notes", CallsCount = 10 };
        _mockService.Setup(s => s.SaveAgentDataAsync(1, dto)).ReturnsAsync((true, "Saved", 1));

        var result = await _sut.SaveData(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task SaveData_NullBody_ReturnsBadRequest()
    {
        var result = await _sut.SaveData(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetSavedData_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new AgentSaveDto { Notes = "saved notes" };
        _mockService.Setup(s => s.GetSavedDataAsync(1)).ReturnsAsync(expected);

        var result = await _sut.GetSavedData();

        var val = OkValue<AgentSaveDto>(result);
        val.Notes.Should().Be("saved notes");
    }
}
