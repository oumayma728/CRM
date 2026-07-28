using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public class CallsController : ControllerBase
{
    private readonly ApplicationDbContext _ctx;
    public CallsController(ApplicationDbContext ctx) => _ctx = ctx;

    [HttpGet]
    public async Task<IActionResult> GetCalls([FromQuery] string? agentName, [FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        var query = _ctx.Set<Backend.Entities.Appel>().AsNoTracking()
            .Include(a => a.Agent).Include(a => a.Contact).AsQueryable();
        if (!string.IsNullOrWhiteSpace(agentName))
            query = query.Where(a => (a.Agent.Prenom + " " + a.Agent.Nom).Contains(agentName));
        var total = await query.CountAsync();
        var calls = await query.OrderByDescending(a => a.DateHeure)
            .Skip(offset).Take(limit)
            .Select(a => new
            {
                a.Id, AgentName = a.Agent.Prenom + " " + a.Agent.Nom, ClientName = a.Contact.Prenom + " " + a.Contact.Nom,
                a.DateHeure, a.DureeSecondes, a.Qualification, a.Enregistre
            }).ToListAsync();
        return Ok(new { calls, total, limit, offset });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCall(long id)
    {
        var call = await _ctx.Set<Backend.Entities.Appel>().AsNoTracking()
            .Include(a => a.Agent).Include(a => a.Contact)
            .Select(a => new
            {
                a.Id, AgentName = a.Agent.Prenom + " " + a.Agent.Nom, ClientName = a.Contact.Prenom + " " + a.Contact.Nom,
                a.DateHeure, a.DureeSecondes, a.Qualification, a.Enregistre, a.CheminEnregistrement
            }).FirstOrDefaultAsync(a => a.Id == id);
        if (call == null) return NotFound(new { error = "Call not found" });
        return Ok(call);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var calls = await _ctx.Set<Backend.Entities.Appel>().AsNoTracking().ToListAsync();
        return Ok(new
        {
            totalCalls = calls.Count,
            avgDuration = calls.Any() ? (int)calls.Average(a => a.DureeSecondes) : 0,
            qualificationDist = calls.GroupBy(a => a.Qualification).ToDictionary(g => g.Key.ToString(), g => g.Count())
        });
    }
}
