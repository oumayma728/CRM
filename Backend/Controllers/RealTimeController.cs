using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/admin/realtime")]
[Authorize(Roles = "ADMIN,SuperAdmin,QUALITE")]
public class RealTimeController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public RealTimeController(ApplicationDbContext context) => _context = context;

    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents()
    {
        var agents = await _context.Utilisateurs
            .Where(u => u.Role == "AGENT")
            .AsNoTracking()
            .Take(50)
            .Select(u => new { u.Id, name = $"{u.Prenom} {u.Nom}" })
            .ToListAsync();

        var agentIds = agents.Select(a => a.Id).ToList();
        var now = DateTime.UtcNow;
        var fiveMinAgo = now.AddMinutes(-5);
        var fifteenMinAgo = now.AddMinutes(-15);

        var recentCalls = await _context.Appels
            .Where(a => agentIds.Contains(a.AgentId) && a.DateHeure >= fifteenMinAgo)
            .AsNoTracking()
            .ToListAsync();

        var callCounts = recentCalls.GroupBy(a => a.AgentId).ToDictionary(g => g.Key, g => g.Count());

        var result = agents.Select(a =>
        {
            var hasRecentCall = recentCalls.Any(c => c.AgentId == a.Id && c.DateHeure >= fiveMinAgo);
            var callCount = callCounts.GetValueOrDefault(a.Id, 0);
            var status = hasRecentCall ? "active" : callCount > 0 ? "break" : "inactive";
            return new
            {
                a.Id,
                a.name,
                status,
                calls = callCount,
                idleTime = hasRecentCall ? 0 : fifteenMinAgo.Subtract(recentCalls.Where(c => c.AgentId == a.Id).OrderByDescending(c => c.DateHeure).Select(c => c.DateHeure).FirstOrDefault(fifteenMinAgo)).Minutes
            };
        });

        return Ok(result);
    }

    [HttpGet("hourly")]
    public async Task<IActionResult> GetHourly()
    {
        var today = DateTime.UtcNow.Date;
        var appels = await _context.Appels
            .AsNoTracking()
            .Where(a => a.DateHeure >= today)
            .ToListAsync();

        var hourly = appels
            .GroupBy(a => a.DateHeure.Hour)
            .Select(g => new { hour = g.Key, appels = g.Count() })
            .OrderBy(h => h.hour)
            .ToList();

        var fullHourly = Enumerable.Range(0, 24).Select(h =>
        {
            var match = hourly.FirstOrDefault(x => x.hour == h);
            return new { h = $"{h:D2}h", appels = match?.appels ?? 0 };
        });

        return Ok(fullHourly);
    }
}
