using CrmApi.DTOs.Quality;
using CrmApi.Helpers;
using CrmApi.Services.Quality;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/quality")]
[Authorize]
public class QualityController : ControllerBase
{
    private readonly IQualityService _qualityService;
    private readonly IQualityDashboardService _dashboardService;

    public QualityController(IQualityService qualityService, IQualityDashboardService dashboardService)
    {
        _qualityService = qualityService;
        _dashboardService = dashboardService;
    }

    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] CreateEvaluationDto dto)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var evaluatorId = UserContextHelper.GetUserId(User);
            var success = await _qualityService.CreateEvaluationAsync(evaluatorId, dto);
            return Ok(new { success, message = "Evaluation saved" });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("evaluations/{agentId}")]
    public async Task<IActionResult> GetAgentEvaluations(int agentId)
    {
        try { return Ok(await _qualityService.GetAgentEvaluationsAsync(agentId)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("evaluations")]
    public async Task<IActionResult> GetAllEvaluations()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _qualityService.GetAllEvaluationsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _qualityService.GetStatsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpDelete("evaluations/{evalId}")]
    public async Task<IActionResult> DeleteEvaluation(int evalId)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try
        {
            var success = await _qualityService.DeleteEvaluationAsync(evalId);
            if (!success) return NotFound(new { error = "Evaluation not found" });
            return Ok(new { success, message = "Deleted" });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/team-status")]
    public async Task<IActionResult> GetTeamStatus()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetTeamStatusAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/agents-state")]
    public async Task<IActionResult> GetAgentsState()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetAgentsStateAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/global-stats")]
    public async Task<IActionResult> GetGlobalStats()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetGlobalStatsAsync()); }
        catch (Exception ex)
{
    Console.WriteLine("===== GLOBAL STATS ERROR =====");
    Console.WriteLine(ex.ToString());

    return StatusCode(500, new
    {
        error = ex.Message,
        detail = ex.InnerException?.Message
    });
}
    }

    [HttpGet("dashboard/alerts")]
    public async Task<IActionResult> GetDashboardAlerts()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetDashboardAlertsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/evaluation-history")]
    public async Task<IActionResult> GetEvaluationHistory([FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetEvaluationHistoryAsync(limit, offset)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/agent-detail/{agentId}")]
    public async Task<IActionResult> GetAgentDetail(int agentId)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetAgentDetailAsync(agentId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/rdv-jour")]
    public async Task<IActionResult> GetRdvJour()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetRdvJourAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("dashboard/comparison")]
    public async Task<IActionResult> GetComparison()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _dashboardService.GetComparisonAsync()); }
        catch (Exception ex)
{
    Console.WriteLine("===== COMPARISON ERROR =====");
    Console.WriteLine(ex.ToString());

    return StatusCode(500, new
    {
        error = ex.Message,
        detail = ex.InnerException?.Message
    });
}
    }
}
