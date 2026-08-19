using CrmApi.DTOs.Salary;
using CrmApi.Helpers;
using CrmApi.Services.Salary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/salaries")]
[Authorize]
public class SalaryController : ControllerBase
{
    private readonly ISalaryService _salaryService;

    public SalaryController(ISalaryService salaryService) => _salaryService = salaryService;

    [HttpGet]
    public async Task<IActionResult> GetSalaries([FromQuery] string? month)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _salaryService.GetSalariesAsync(month)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("monthly-summary")]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] string? month)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _salaryService.GetMonthlySummaryAsync(month)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("calculate")]
    public async Task<IActionResult> Calculate([FromQuery] string? month)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _salaryService.CalculateAllSalariesAsync(month)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("rules")]
    public async Task<IActionResult> GetRules([FromQuery] string? role)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _salaryService.GetSalaryRulesAsync(role)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] CreateSalaryRuleDto dto)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _salaryService.CreateSalaryRuleAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("rules/{ruleId}")]
    public async Task<IActionResult> UpdateRule(int ruleId, [FromBody] UpdateSalaryRuleDto dto)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var success = await _salaryService.UpdateSalaryRuleAsync(ruleId, dto);
            if (!success) return NotFound(new { error = "Salary rule not found" });
            return Ok(new { success });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpDelete("rules/{ruleId}")]
    public async Task<IActionResult> DeleteRule(int ruleId)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try
        {
            var success = await _salaryService.DeleteSalaryRuleAsync(ruleId);
            if (!success) return NotFound(new { error = "Salary rule not found" });
            return Ok(new { success });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("{agentId}")]
    public async Task<IActionResult> GetAgentSalary(int agentId, [FromQuery] string? month)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _salaryService.GetAgentSalaryDetailAsync(agentId, month)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("{salaryId}/payment")]
    public async Task<IActionResult> UpdatePayment(int salaryId, [FromBody] PaymentStatusDto dto)
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var success = await _salaryService.UpdatePaymentStatusAsync(salaryId, dto.Status);
            if (!success) return NotFound(new { error = "Salary record not found" });
            return Ok(new { success });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
