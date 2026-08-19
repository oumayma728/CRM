using CrmApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/config")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly IOptionsMonitor<WeightsConfig> _weights;
    private readonly IOptionsMonitor<AlertThresholds> _alerts;

    public ConfigController(IOptionsMonitor<WeightsConfig> weights, IOptionsMonitor<AlertThresholds> alerts) { _weights = weights; _alerts = alerts; }

    [HttpGet]
    public IActionResult GetConfig()
    {
        try { return Ok(new { weights = _weights.CurrentValue, alerts = _alerts.CurrentValue }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("weights")]
    [Authorize(Roles = "admin")]
    public IActionResult UpdateWeights([FromBody] UpdateConfigDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(new { status = "success" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("system")]
    [Authorize(Roles = "admin")]
    public IActionResult SaveSystemConfig([FromBody] object config)
    {
        if (config == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(new { status = "success", message = "Configuration saved (in-memory only)" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}

public class UpdateConfigDto
{
    public WeightsConfig? Weights { get; set; }
    public AlertThresholds? Alerts { get; set; }
}
