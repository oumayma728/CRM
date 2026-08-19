using CrmApi.DTOs.Attendance;
using CrmApi.Helpers;
using CrmApi.Services.Attendance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService) => _attendanceService = attendanceService;

    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn()
    {
        try { return Ok(await _attendanceService.ClockInAsync(UserContextHelper.GetUserId(User))); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("clock-out")]
    public async Task<IActionResult> ClockOut()
    {
        try
        {
            var result = await _attendanceService.ClockOutAsync(UserContextHelper.GetUserId(User));
            return result.Success ? Ok(result) : BadRequest(new { error = result.Message ?? "No active attendance" });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("break/start")]
    public async Task<IActionResult> StartBreak([FromBody] BreakRequestDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Type))
            return BadRequest(new { error = "Break type is required" });

        try
        {
            var result = await _attendanceService.StartBreakAsync(UserContextHelper.GetUserId(User), dto.Type);
            if (!result.Success) return BadRequest(new { error = result.Message ?? "Cannot start break" });
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("break/end")]
    public async Task<IActionResult> EndBreak()
    {
        try
        {
            var result = await _attendanceService.EndBreakAsync(UserContextHelper.GetUserId(User));
            return result.Success ? Ok(result) : BadRequest(new { error = result.Message ?? "No break in progress" });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try { return Ok(await _attendanceService.GetStatusAsync(UserContextHelper.GetUserId(User))); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetReport()
    {
        if (!UserContextHelper.IsAdminOrQualite(User)) return Forbid();
        try { return Ok(await _attendanceService.GetReportAsync()); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("update/{userId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateAttendance(int userId, [FromBody] UpdateAttendanceDto dto)
    {
        try
        {
            var success = await _attendanceService.UpdateAttendanceAsync(userId, dto);
            return success ? Ok(new { success }) : NotFound(new { error = "No active attendance found for user" });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("team-status")]
    [Authorize(Roles = "admin,qualite")]
    public async Task<IActionResult> GetTeamStatus()
    {
        try { return Ok(await _attendanceService.GetTeamStatusAsync()); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("team-report")]
    [Authorize(Roles = "admin,qualite")]
    public async Task<IActionResult> GetTeamReport()
    {
        try { return Ok(await _attendanceService.GetTeamReportAsync()); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("team-detail")]
    [Authorize(Roles = "admin,qualite")]
    public async Task<IActionResult> GetTeamDetail()
    {
        try { return Ok(await _attendanceService.GetTeamAttendanceDetailAsync()); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
