using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/followups")]
[Authorize(Roles = "ADMIN,SuperAdmin,QUALITE")]
public class FollowupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public FollowupsController(ApplicationDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var followups = await _context.Followups
            .AsNoTracking()
            .Include(f => f.Agent)
            .Include(f => f.Contact)
            .OrderByDescending(f => f.UpdatedAt)
            .Select(f => new
            {
                f.Id,
                f.ContactId,
                contactName = f.Contact != null ? $"{f.Contact.Prenom} {f.Contact.Nom}" : null,
                f.AgentId,
                agentName = f.Agent != null ? $"{f.Agent.Prenom} {f.Agent.Nom}" : null,
                f.AppointmentDate,
                f.Status,
                f.RelanceCount,
                f.Notes,
                f.CreatedAt,
                f.UpdatedAt
            })
            .ToListAsync();

        var total = followups.Count;
        var stats = new
        {
            total,
            aRelancer = followups.Count(f => f.Status == "a_relancer"),
            relanceEnCours = followups.Count(f => f.Status == "relance_en_cours"),
            convertis = followups.Count(f => f.Status == "converti"),
            tauxConversion = total > 0 ? Math.Round((double)followups.Count(f => f.Status == "converti") / total * 100, 1) : 0
        };

        var byStatus = followups
            .GroupBy(f => f.Status ?? "unknown")
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToList();

        var byAgent = followups
            .GroupBy(f => f.agentName ?? "Inconnu")
            .Select(g => new { agent = g.Key, count = g.Count() })
            .ToList();

        return Ok(new { stats, followups, byStatus, byAgent });
    }

    [HttpPut("{id}/relance")]
    public async Task<IActionResult> Relance(long id)
    {
        var f = await _context.Followups.FindAsync(id);
        if (f == null) return NotFound();

        f.RelanceCount++;
        f.Status = f.RelanceCount >= 3 ? "perdu" : "relance_en_cours";
        f.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true, f.RelanceCount, f.Status });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusDto dto)
    {
        var f = await _context.Followups.FindAsync(id);
        if (f == null) return NotFound();

        f.Status = dto.Status;
        f.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
}
