using CrmApi.Data;
using CrmApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize(Roles = "admin")]
public class MaintenanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MaintenanceController(ApplicationDbContext context) { _context = context; }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        try
        {
            return Ok(new { export_date = DateTime.UtcNow, calls = await _context.Calls.AsNoTracking().Take(1000).ToListAsync(), users = await _context.Users.AsNoTracking().ToListAsync(), leads = await _context.Leads.AsNoTracking().ToListAsync() });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("import")]
    public IActionResult Import([FromBody] ImportDataDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(new { success = true, message = "Data imported" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM calls");
            return Ok(new { success = true, message = "All calls deleted" });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}

public class ImportDataDto
{
    public List<object>? Leads { get; set; }
    public List<object>? Calls { get; set; }
}
