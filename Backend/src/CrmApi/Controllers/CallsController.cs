using CrmApi.DTOs.Call;
using CrmApi.Helpers;
using CrmApi.Services.Call;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public class CallsController : ControllerBase
{
    private readonly ICallService _callService;

    public CallsController(ICallService callService) => _callService = callService;

    [HttpGet]
    public async Task<IActionResult> GetCalls([FromQuery] string? agentName, [FromQuery] string? sentiment, [FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        var userId = UserContextHelper.GetUserId(User);
        var role = UserContextHelper.GetRole(User);
        try { return Ok(await _callService.GetCallsAsync(userId, role, agentName, sentiment, limit, offset)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("{callId}")]
    public async Task<IActionResult> GetCall(int callId)
    {
        var userId = UserContextHelper.GetUserId(User);
        var role = UserContextHelper.GetRole(User);
        try
        {
            var call = await _callService.GetCallByIdAsync(callId, userId, role);
            return call != null ? Ok(call) : NotFound(new { error = "Call not found" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? agentName)
    {
        var userId = UserContextHelper.GetUserId(User);
        var role = UserContextHelper.GetRole(User);
        try { return Ok(await _callService.GetCallStatsAsync(userId, role, agentName)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents-summary")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAgentsSummary()
    {
        try { return Ok(await _callService.GetAgentsSummaryAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveCall([FromBody] CallSaveDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        var userId = UserContextHelper.GetUserId(User);
        try
        {
            var (success, callId, message) = await _callService.SaveCallAsync(userId, dto);
            if (!success) return BadRequest(new { success, call_id = callId, message });
            return Ok(new { success, call_id = callId, message });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
