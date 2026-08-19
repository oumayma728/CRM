using CrmApi.DTOs.Lead;
using CrmApi.Services.Lead;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/leads")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService) => _leadService = leadService;

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromForm] IFormFile file, [FromForm] string? campaignName, [FromForm] string? companyName)
    {
        if (file == null || file.Length == 0) return BadRequest(new { error = "File is required" });
        try { return Ok(await _leadService.ImportLeadsAsync(file, campaignName, companyName)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try { return Ok(await _leadService.GetStatsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet]
    public async Task<IActionResult> GetLeads()
    {
        try { return Ok(await _leadService.GetLeadsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
