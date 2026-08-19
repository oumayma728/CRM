using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/performance")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public PerformanceController(ApplicationDbContext context) => _context = context;

    private static bool IsConversion(CallAttempt a) => a.QualificationStatus != null && a.QualificationStatus.StartsWith("rdv");
    private static bool IsRefusal(CallAttempt a) => a.QualificationStatus == "refus";

    private static (DateTime start, DateTime end) MonthRange(DateTime anchor)
    {
        var start = new DateTime(anchor.Year, anchor.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return (start, start.AddMonths(1));
    }

    private async Task<object> ComputeMonthStats(DateTime start, DateTime end, int? agentId)
    {
        var query = _context.CallAttempts.AsNoTracking()
            .Where(a => a.StartedAt >= start && a.StartedAt < end);
        if (agentId.HasValue) query = query.Where(a => a.AgentId == agentId.Value);

        var calls = await query.ToListAsync();
        var total = calls.Count;
        var conversions = calls.Count(IsConversion);
        var refusals = calls.Count(IsRefusal);
        var avgDuration = calls.Count(c => c.DurationSeconds.HasValue) > 0
            ? calls.Where(c => c.DurationSeconds.HasValue).Average(c => c.DurationSeconds!.Value)
            : 0;

        return new
        {
            totalCalls = total,
            conversions,
            conversionRate = total > 0 ? Math.Round(conversions * 100.0 / total, 1) : 0,
            refusals,
            refusalRate = total > 0 ? Math.Round(refusals * 100.0 / total, 1) : 0,
            avgDuration = Math.Round(avgDuration / 60.0, 1)
        };
    }

    // ── GET /api/performance/comparison?month=&agentId= ─────────────────────
    [HttpGet("comparison")]
    public async Task<IActionResult> GetComparison([FromQuery] string? month, [FromQuery] int? agentId)
    {
        var anchor = !string.IsNullOrEmpty(month) && DateTime.TryParse(month + "-01", out var parsed)
            ? parsed
            : DateTime.UtcNow;

        var (curStart, curEnd) = MonthRange(anchor);
        var (prevStart, prevEnd) = MonthRange(anchor.AddMonths(-1));

        dynamic current = await ComputeMonthStats(curStart, curEnd, agentId);
        dynamic previous = await ComputeMonthStats(prevStart, prevEnd, agentId);

        double Evo(double cur, double prev) => prev > 0 ? Math.Round((cur - prev) * 100.0 / prev, 1) : (cur > 0 ? 100 : 0);

        var evolution = new
        {
            totalCalls = Evo(current.totalCalls, previous.totalCalls),
            conversions = Evo(current.conversions, previous.conversions),
            conversionRate = Evo(current.conversionRate, previous.conversionRate),
            refusalRate = Evo(current.refusalRate, previous.refusalRate),
            avgDuration = Evo(current.avgDuration, previous.avgDuration)
        };

        var monthlyData = new List<object>();
        for (int i = 5; i >= 0; i--)
        {
            var (mStart, mEnd) = MonthRange(anchor.AddMonths(-i));
            var q = _context.CallAttempts.AsNoTracking().Where(a => a.StartedAt >= mStart && a.StartedAt < mEnd);
            if (agentId.HasValue) q = q.Where(a => a.AgentId == agentId.Value);
            var calls = await q.ToListAsync();
            monthlyData.Add(new
            {
                month = mStart.ToString("MMM"),
                calls = calls.Count,
                conversions = calls.Count(IsConversion),
                refusals = calls.Count(IsRefusal)
            });
        }

        var rendementStatus = evolution.conversionRate >= 0 ? "augmenté" : "diminué";
        var mistakes = new List<string>();
        if (current.refusalRate > 40) mistakes.Add($"Taux de refus élevé ce mois ({current.refusalRate}%)");
        if (current.avgDuration < 1.0 && current.totalCalls > 0) mistakes.Add("Durée moyenne d'appel très courte — vérifier la qualité des échanges");

        return Ok(new
        {
            currentMonth = current,
            previousMonth = previous,
            evolution,
            monthlyData,
            rendementStatus,
            mistakes
        });
    }

    // ── GET /api/performance/global-comparison ────────────────────────────────
    /// <summary>Comparaison aujourd'hui/hier, semaine/précédente, mois/précédent (toute l'équipe)</summary>
    [HttpGet("global-comparison")]
    public async Task<IActionResult> GetGlobalComparison()
    {
        async Task<object> Period(DateTime curStart, DateTime curEnd, DateTime prevStart, DateTime prevEnd)
        {
            var curCalls = await _context.CallAttempts.AsNoTracking().Where(a => a.StartedAt >= curStart && a.StartedAt < curEnd).ToListAsync();
            var prevCalls = await _context.CallAttempts.AsNoTracking().Where(a => a.StartedAt >= prevStart && a.StartedAt < prevEnd).ToListAsync();

            var curTotal = curCalls.Count;
            var prevTotal = prevCalls.Count;
            var curScore = curTotal > 0 ? Math.Round(curCalls.Count(IsConversion) * 100.0 / curTotal, 1) : 0;
            var prevScore = prevTotal > 0 ? Math.Round(prevCalls.Count(IsConversion) * 100.0 / prevTotal, 1) : 0;

            double Evo(double cur, double prev) => prev > 0 ? Math.Round((cur - prev) * 100.0 / prev, 1) : (cur > 0 ? 100 : 0);

            return new
            {
                current = new { total = curTotal, avg_score = curScore },
                previous = new { total = prevTotal, avg_score = prevScore },
                evolution = Evo(curTotal, prevTotal),
                score_evol = Evo(curScore, prevScore)
            };
        }

        var today = DateTime.UtcNow.Date;
        var dayResult = await Period(today, today.AddDays(1), today.AddDays(-1), today);

        var dow = (int)today.DayOfWeek == 0 ? 7 : (int)today.DayOfWeek; // Monday=1..Sunday=7
        var weekStart = today.AddDays(-(dow - 1));
        var weekResult = await Period(weekStart, weekStart.AddDays(7), weekStart.AddDays(-7), weekStart);

        var (monthStart, monthEnd) = MonthRange(today);
        var (prevMonthStart, prevMonthEnd) = MonthRange(today.AddMonths(-1));
        var monthResult = await Period(monthStart, monthEnd, prevMonthStart, prevMonthEnd);

        return Ok(new { day = dayResult, week = weekResult, month = monthResult });
    }

    // ── GET /api/performance/agent/{agentId} ─────────────────────────────────
    [HttpGet("agent/{agentId:int}")]
    public async Task<IActionResult> GetAgentPerformance(int agentId)
    {
        var now = DateTime.UtcNow;
        var (curStart, curEnd) = MonthRange(now);
        var (prevStart, prevEnd) = MonthRange(now.AddMonths(-1));

        var current = await ComputeMonthStats(curStart, curEnd, agentId);
        var previous = await ComputeMonthStats(prevStart, prevEnd, agentId);

        var calls = await _context.CallAttempts.AsNoTracking()
            .Where(a => a.AgentId == agentId && a.StartedAt >= curStart && a.StartedAt < curEnd)
            .ToListAsync();

        var dailyPerformance = calls
            .GroupBy(a => a.StartedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                date = g.Key.ToString("yyyy-MM-dd"),
                calls = g.Count(),
                conversions = g.Count(IsConversion)
            });

        return Ok(new { agentId, current, previous, dailyPerformance });
    }

    // ── GET /api/performance/agents?month= ────────────────────────────────────
    [HttpGet("agents")]
    [Authorize(Roles = "ADMIN,QUALITE,SuperAdmin")]
    public async Task<IActionResult> GetAgentsPerformance([FromQuery] string? month)
    {
        var anchor = !string.IsNullOrEmpty(month) && DateTime.TryParse(month + "-01", out var parsed)
            ? parsed
            : DateTime.UtcNow;
        var (start, end) = MonthRange(anchor);

        var calls = await _context.CallAttempts.AsNoTracking()
            .Include(a => a.Agent)
            .Where(a => a.StartedAt >= start && a.StartedAt < end)
            .ToListAsync();

        var result = calls
            .GroupBy(a => a.AgentId)
            .Select(g =>
            {
                var total = g.Count();
                var conversions = g.Count(IsConversion);
                var refusals = g.Count(IsRefusal);
                var agentName = g.First().Agent != null ? $"{g.First().Agent!.FirstName} {g.First().Agent!.LastName}".Trim() : $"Agent #{g.Key}";
                return new
                {
                    id = g.Key,
                    name = agentName,
                    current = total,
                    score = total > 0 ? Math.Round(conversions * 100.0 / total, 1) : 0,
                    conversions,
                    refusals,
                    activity = g.GroupBy(a => a.StartedAt.DayOfWeek).Select(d => new { day = d.Key.ToString(), count = d.Count() })
                };
            })
            .OrderByDescending(a => a.score)
            .ToList();

        return Ok(result);
    }
}
