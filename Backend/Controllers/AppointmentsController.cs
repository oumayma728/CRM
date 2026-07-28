using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;
    public AppointmentsController(ApplicationDbContext ctx) => _ctx = ctx;

    [HttpGet]
    public async Task<IActionResult> GetAppointments([FromQuery] string? date, [FromQuery] long? agentId)
    {
        var query = _ctx.Set<RendezVous>().AsNoTracking()
            .Include(r => r.Contact).Include(r => r.Agent).AsQueryable();
        if (DateOnly.TryParse(date, out var d))
            query = query.Where(r => DateOnly.FromDateTime(r.DateRendezVous) == d);
        if (agentId.HasValue)
            query = query.Where(r => r.AgentId == agentId.Value);
        var result = await query.Select(r => new
        {
            r.Id,
            r.AgentId,
            AgentName = r.Agent.Prenom + " " + r.Agent.Nom,
            ClientName = r.Contact.Prenom + " " + r.Contact.Nom,
            r.Contact.Telephone,
            r.DateRendezVous,
            r.Statut,
            r.TypeProjet,
            r.TypeRendezVous,
            r.Commentaire,
            r.MotifRefus,
            r.DateCreation
        }).ToListAsync();
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        var rdv = await _ctx.Set<RendezVous>().FindAsync(id);
        if (rdv == null) return NotFound(new { error = "Rendez-vous not found" });
        if (!Enum.TryParse<StatutRendezVous>(dto.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        rdv.Statut = status;
        await _ctx.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public class UpdateAppointmentStatusDto
{
    public string Status { get; set; } = string.Empty;
}
