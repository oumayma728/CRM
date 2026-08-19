using CrmApi.Helpers;
using CrmApi.Services.Analytics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService) => _analyticsService = analyticsService;

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetOverviewAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents-performance")]
    public async Task<IActionResult> GetAgentsPerformance()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetAgentsPerformanceAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("supervision")]
    public async Task<IActionResult> GetSupervision()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetSupervisionAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("geo")]
    public async Task<IActionResult> GetGeo()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetGeoAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("followups")]
    public async Task<IActionResult> GetFollowups()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetFollowupsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("calls-log")]
    public async Task<IActionResult> GetCallsLog([FromQuery] int limit = 200)
    {
        var role = UserContextHelper.GetRole(User);
        if (role == "agent")
        {
            var userName = UserContextHelper.GetUsername(User);
            try { return Ok(await _analyticsService.GetCallsLogAsync(limit, userName)); }
            catch (Exception ex) { return Problem(ex.Message); }
        }
        else if (UserContextHelper.IsAdminOrQualite(User))
        {
            try { return Ok(await _analyticsService.GetCallsLogAsync(limit)); }
            catch (Exception ex) { return Problem(ex.Message); }
        }
        return Forbid();
    }

    [HttpGet("pointage")]
    public async Task<IActionResult> GetPointage()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetPointageAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("live-agents")]
    public async Task<IActionResult> GetLiveAgents()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetLiveAgentsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("calls-today")]
    public async Task<IActionResult> GetCallsToday()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetCallsTodayAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("comparison")]
    public async Task<IActionResult> GetComparison()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _analyticsService.GetComparisonAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
