using Backend.Attributes;
using Backend.DTOs.AgentWorkspace;
using Backend.Config;
using Backend.Helpers;
using Backend.Services.AgentWorkspace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[SnakeCaseJson]
[ApiController]
[Route("api/agents")]
[Authorize]
public class AgentWorkspaceController : ControllerBase
{
    private readonly IAgentWorkspaceService _agentService;

    public AgentWorkspaceController(IAgentWorkspaceService agentService) => _agentService = agentService;

    // GET /api/agents is the campaign-agent CRUD list (AgentProfilesController); this simple
    // id/name list used by the call-analysis pages lives under /api/agents/names.
    [HttpGet("names")]
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
