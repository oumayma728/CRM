using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/config")]
[Authorize(Roles = "ADMIN,SuperAdmin")]
public class ConfigController : ControllerBase
{
    private static WeightsConfig _weights = new();
    private static AlertThresholds _alerts = new();
    private static readonly object _lock = new();

    [HttpGet]
    public IActionResult GetConfig()
    {
        lock (_lock)
        {
            return Ok(new { weights = _weights, alerts = _alerts });
        }
    }

    [HttpPut]
    public IActionResult UpdateConfig([FromBody] UpdateConfigDto dto)
    {
        if (dto.Weights != null)
        {
            lock (_lock) { _weights = dto.Weights; }
        }
        if (dto.Alerts != null)
        {
            lock (_lock) { _alerts = dto.Alerts; }
        }
        return Ok(new { success = true, weights = _weights, alerts = _alerts });
    }

    [HttpPost("reset")]
    public IActionResult ResetConfig()
    {
        lock (_lock)
        {
            _weights = new WeightsConfig();
            _alerts = new AlertThresholds();
        }
        return Ok(new { success = true, message = "Configuration réinitialisée" });
    }
}

public class UpdateConfigDto
{
    public WeightsConfig? Weights { get; set; }
    public AlertThresholds? Alerts { get; set; }
}
