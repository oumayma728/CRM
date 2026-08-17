using CrmApi.DTOs.Ai;
using CrmApi.Helpers;
using CrmApi.Services.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiScoringController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiScoringController(IAiService aiService) => _aiService = aiService;

    [HttpPost("score")]
    public async Task<IActionResult> Score([FromBody] EligibilityRequestDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.ScoreEligibilityAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("analyze-eligibility")]
    public async Task<IActionResult> AnalyzeEligibility([FromBody] EligibilityRequestDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.AnalyzeEligibilityAsync(UserContextHelper.GetUserId(User), dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("detect-fake-rdv")]
    public async Task<IActionResult> DetectFakeRdv([FromBody] FakeRdvRequestDto dto)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.DetectFakeRdvAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("insights/{agentId}")]
    public async Task<IActionResult> GetInsights(int agentId)
    {
        try { return Ok(await _aiService.GetInsightsAsync(agentId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
