using CrmApi.DTOs.Appointment;
using CrmApi.Helpers;
using CrmApi.Services.Appointment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService) => _appointmentService = appointmentService;
[HttpGet]
public async Task<IActionResult> GetAppointments([FromQuery] string? date, [FromQuery] int? agentId)
{
    try
    {
        var result = await _appointmentService.GetAppointmentsAsync(date, agentId);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            message = ex.Message,
            inner = ex.InnerException?.Message,
            stack = ex.StackTrace
        });
    }

}

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAppointment(int id)
    {
        try
        {
            var result = await _appointmentService.GetAppointmentByIdAsync(id);
            return result != null ? Ok(result) : NotFound(new { error = "Appointment not found" });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

   [HttpPost]
public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
{
    if (dto == null)
        return BadRequest(new { error = "Request body is required" });

    if (string.IsNullOrWhiteSpace(dto.ClientName))
        return BadRequest(new { error = "Client name is required" });

    if (dto.AppointmentDate == default)
        return BadRequest(new { error = "Appointment date is required" });

    try
    {
        var result = await _appointmentService.CreateAppointmentAsync(
            UserContextHelper.GetUserId(User),
            dto);

        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            message = ex.Message,
            inner = ex.InnerException?.Message,
            stack = ex.StackTrace
        });
    }
}

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(int id, [FromBody] UpdateAppointmentDto dto)
    {
        try
        {
            var (success, qualityScore) = await _appointmentService.UpdateAppointmentAsync(id, dto);
            return Ok(new { success, quality_score = qualityScore });
        }
        catch (KeyNotFoundException) { return NotFound(new { error = "Appointment not found" }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,qualite")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var success = await _appointmentService.DeleteAppointmentAsync(id);
            return success ? Ok(new { success }) : NotFound(new { error = "Appointment not found" });
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status)) return BadRequest(new { error = "Status is required" });
        try
        {
            var success = await _appointmentService.UpdateAppointmentStatusAsync(id, dto.Status);
            return success ? Ok(new { success }) : NotFound(new { error = "Appointment not found" });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
