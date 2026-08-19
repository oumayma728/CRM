using CrmApi.DTOs.Agent;
using CrmApi.Helpers;
using CrmApi.Services.Agent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/agents")]
[Authorize]
public class AgentsController : ControllerBase
{
    private readonly IAgentService _agentService;

    public AgentsController(IAgentService agentService) => _agentService = agentService;

    [HttpGet]
    public async Task<IActionResult> GetAgents()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _agentService.GetAgentsAsync()); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{agentId}/performance")]
    public async Task<IActionResult> GetAgentPerformance(string agentId)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _agentService.GetAgentPerformanceAsync(agentId)); }
        catch (KeyNotFoundException) { return NotFound(new { error = "Agent not found" }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("save")]
    [Authorize]
    public async Task<IActionResult> SaveData([FromBody] AgentSaveDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var userId = UserContextHelper.GetUserId(User);
            var (success, message, agentId) = await _agentService.SaveAgentDataAsync(userId, dto);
            return Ok(new { success, message, agent_id = agentId });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("saved")]
    [Authorize]
    public async Task<IActionResult> GetSavedData()
    {
        try { return Ok(await _agentService.GetSavedDataAsync(UserContextHelper.GetUserId(User))); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
