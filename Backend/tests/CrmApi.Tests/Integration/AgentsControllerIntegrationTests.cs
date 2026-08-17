using CrmApi.Controllers;
using CrmApi.DTOs.Agent;
using CrmApi.Services.Agent;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class AgentsControllerIntegrationTests : ControllerTestBase
{
    private readonly Mock<IAgentService> _mockService;
    private readonly AgentsController _adminController;
    private readonly AgentsController _agentController;

    public AgentsControllerIntegrationTests()
    {
        _mockService = CreateMockService<IAgentService>();
        _adminController = CreateController(() => new AgentsController(_mockService.Object), role: "admin");
        _agentController = CreateController(() => new AgentsController(_mockService.Object), userId: 2, role: "agent");
    }

    [Fact]
    public async Task GetAgents_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAgentsAsync()).ReturnsAsync(new List<AgentSimpleDto>());

        var result = await _adminController.GetAgents();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAgentPerformance_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAgentPerformanceAsync("2"))
            .ReturnsAsync(new AgentPerformanceDetailDto { AgentName = "Agent" });

        var result = await _adminController.GetAgentPerformance("2");

        var value = OkValue<AgentPerformanceDetailDto>(result);
        value.AgentName.Should().Be("Agent");
    }

    [Fact]
    public async Task GetAgentPerformance_AgentAccessingOwn_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAgentPerformanceAsync("2"))
            .ReturnsAsync(new AgentPerformanceDetailDto { AgentName = "Agent" });

        var result = await _agentController.GetAgentPerformance("2");
        AssertForbid(result);
    }
}
