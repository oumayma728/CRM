using Backend.Data;
using Backend.DTOs.Analytics;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;

    public AnalyticsService(ApplicationDbContext context) => _context = context;

    public async Task<OverviewDto> GetOverviewAsync()
    {
        var calls = await _context.Appels.AsNoTracking()
            .Include(c => c.Contact)
            .ToListAsync();
        var today = DateTime.UtcNow.Date;
        var callsToday = calls.Count(c => c.DateHeure.Date == today);

        var avgDuration = 0.0;
        if (calls.Count > 0)
            avgDuration = Math.Round(calls.Average(c => c.DureeSecondes), 1);

        var followups = await _context.Followups.AsNoTracking().ToListAsync();
        var pendingFollowups = followups.Count(f => f.Status == "a_relancer");

        var thisMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthCalls = calls.Count(c => c.DateHeure >= thisMonth);
        var monthAppointments = await _context.RendezVous.AsNoTracking()
            .CountAsync(r => r.DateRendezVous >= thisMonth && r.DateRendezVous <= today.AddDays(1));
        var conversionRate = monthCalls > 0 ? Math.Round((double)monthAppointments / monthCalls * 100, 1) : 0;

        var hourly = calls.Where(c => c.DateHeure.Date == today)
            .GroupBy(c => c.DateHeure.Hour)
            .Select(g => new HourlyDataDto { Hour = g.Key, Appels = g.Count() })
            .OrderBy(h => h.Hour)
            .ToList();

        var callsWithContact = calls.Where(c => c.Contact != null).ToList();
        var agentCallCounts = calls.GroupBy(c => c.AgentId)
            .Select(g => new { AgentId = g.Key, Count = g.Count(), RdvCount = g.Count(c => c.Qualification == Entities.TypeQualification.RENDEZ_VOUS) })
            .ToList();
        var bestAgent = agentCallCounts.OrderByDescending(a => a.RdvCount).FirstOrDefault();
        var worstAgent = agentCallCounts.OrderBy(a => a.RdvCount).FirstOrDefault();

        string? bestAgentName = null;
        string? worstAgentName = null;
        if (bestAgent != null)
        {
            var bestUser = await _context.Utilisateurs.FindAsync(bestAgent.AgentId);
            bestAgentName = bestUser != null ? $"{bestUser.Prenom} {bestUser.Nom}" : null;
        }
        if (worstAgent != null && worstAgent.AgentId != bestAgent?.AgentId)
        {
            var worstUser = await _context.Utilisateurs.FindAsync(worstAgent.AgentId);
            worstAgentName = worstUser != null ? $"{worstUser.Prenom} {worstUser.Nom}" : null;
        }

        var activeAgentIds = calls.Where(c => c.DateHeure.Date == today)
            .Select(c => c.AgentId)
            .Distinct()
            .Count();

        return new OverviewDto
        {
            TotalCalls = calls.Count,
            AvgScore = 0,
            Sentiments = new Dictionary<string, int>(),
            Performances = new Dictionary<string, int>(),
            BestAgent = bestAgentName,
            WorstAgent = worstAgentName,
            Hourly = hourly,
            Radar = new List<RadarDataDto>
            {
                new() { Critere = "Ecoute", Score = 0 },
                new() { Critere = "Persuasion", Score = 0 },
                new() { Critere = "Empathie", Score = 0 },
                new() { Critere = "Argumentation", Score = 0 },
                new() { Critere = "Refus", Score = 0 },
                new() { Critere = "Vente", Score = 0 }
            },
            CallsToday = callsToday,
            ActiveAgents = activeAgentIds,
            ConversionRate = conversionRate,
            PendingFollowups = pendingFollowups,
            AvgDuration = avgDuration,
            SchedulingTip = GenerateSchedulingTip(hourly)
        };
    }

    public async Task<List<AgentPerformanceDto>> GetAgentsPerformanceAsync()
    {
        var calls = await _context.Appels.AsNoTracking().ToListAsync();
        var agentIds = calls.Select(c => c.AgentId).Distinct().ToList();
        var users = await _context.Utilisateurs.AsNoTracking()
            .Where(u => agentIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.Prenom} {u.Nom}");

        return calls.GroupBy(c => c.AgentId).Select(g =>
        {
            var name = users.TryGetValue(g.Key, out var n) ? n : g.Key.ToString();
            return new AgentPerformanceDto
            {
                AgentName = name,
                TotalCalls = g.Count(),
                AvgScore = 0,
                Positive = 0,
                Negative = 0,
                Neutral = 0,
                TalkRatio = 0,
                ClientRatio = 0
            };
        }).ToList();
    }

    public async Task<SupervisionDto> GetSupervisionAsync()
    {
        var calls = await _context.Appels.AsNoTracking().Include(c => c.Contact).ToListAsync();
        return new SupervisionDto
        {
            Refusals = calls.Where(c => c.Qualification.ToString().StartsWith("REFUS"))
                .GroupBy(c => c.Qualification.ToString())
                .Select(g => new RefusalDto { Motif = g.Key, Count = g.Count() })
                .ToList(),
            RefusalsByAgent = calls.Where(c => c.Qualification.ToString().StartsWith("REFUS"))
                .GroupBy(c => c.AgentId.ToString())
                .Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() })
                .ToList(),
            IncoherenceCount = 0,
            CoherenceAvg = 0,
            IncoherencesByAgent = new List<AgentRefusalDto>(),
            InactivityCount = 0
        };
    }

    public async Task<GeoDto> GetGeoAsync()
    {
        var calls = await _context.Appels.AsNoTracking()
            .Include(c => c.Contact)
            .Where(c => c.Contact != null && !string.IsNullOrEmpty(c.Contact.CodePostal))
            .ToListAsync();

        var depts = calls.GroupBy(c => c.Contact!.CodePostal!.Length >= 2
            ? c.Contact.CodePostal[..2]
            : c.Contact.CodePostal)
            .Select(g =>
            {
                var confirmed = g.Count(c => c.Qualification == Entities.TypeQualification.RENDEZ_VOUS);
                var refused = g.Count(c => c.Qualification.ToString().StartsWith("REFUS"));

                return new DeptDto
                {
                    Dept = g.Key,
                    Total = g.Count(),
                    AvgScore = 0,
                    AvgDuration = Math.Round(g.Average(c => c.DureeSecondes), 1),
                    Confirmed = confirmed,
                    Refused = refused,
                    Waiting = g.Count(c => c.Qualification == Entities.TypeQualification.RAPPEL),
                    PeakHour = g.GroupBy(c => c.DateHeure.Hour)
                        .OrderByDescending(h => h.Count())
                        .FirstOrDefault()?.Key.ToString() + "h",
                    BestAgent = null
                };
            })
            .OrderByDescending(d => d.Total)
            .ToList();

        return new GeoDto
        {
            Departments = depts,
            TotalLocalized = calls.Count,
            DeptCount = depts.Count,
            TopDept = depts.FirstOrDefault()?.Dept
        };
    }

    public async Task<FollowupStatsDto> GetFollowupsAsync()
    {
        var followups = await _context.Followups.AsNoTracking().ToListAsync();
        return new FollowupStatsDto
        {
            Stats = new FollowupSummaryDto
            {
                Total = followups.Count,
                ARelancer = followups.Count(f => f.Status == "a_relancer"),
                RelanceEnCours = followups.Count(f => f.Status == "relance_en_cours"),
                Convertis = followups.Count(f => f.Status == "converti"),
                TauxConversion = followups.Count > 0
                    ? Math.Round((double)followups.Count(f => f.Status == "converti") / followups.Count * 100, 2)
                    : 0
            },
            ByStatus = followups.GroupBy(f => f.Status ?? "unknown")
                .Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() })
                .ToList(),
            ByAgent = followups.Where(f => f.AgentId > 0)
                .GroupBy(f => f.AgentId.ToString())
                .Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() })
                .ToList()
        };
    }

    public async Task<List<CallsLogDto>> GetCallsLogAsync(int limit, string? agentName = null)
    {
        var query = _context.Appels.AsNoTracking()
            .Include(c => c.Contact)
            .AsQueryable();

        if (!string.IsNullOrEmpty(agentName))
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => (u.Prenom + " " + u.Nom).Contains(agentName));
            if (user != null)
                query = query.Where(c => c.AgentId == user.Id);
        }

        return await query.OrderByDescending(c => c.DateHeure).Take(limit)
            .Select(c => new CallsLogDto
            {
                CallId = (int)c.Id,
                AgentName = null,
                CallDate = c.DateHeure,
                Sentiment = null,
                ScorePercentage = 0,
                Performance = null,
                CustomerIntent = null,
                InactivityDetected = false,
                DiarizationMethod = null,
                CallDuration = c.DureeSecondes,
                Summary = null,
                NextSteps = null,
                Qualification = c.Qualification.ToString()
            })
            .ToListAsync();
    }

    public async Task<List<object>> GetPointageAsync()
    {
        var today = DateTime.UtcNow.Date;
        var calls = await _context.Appels.AsNoTracking()
            .Where(c => c.DateHeure.Date == today)
            .ToListAsync();

        var attendances = await _context.AdvancedAttendances.AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();

        var latestByUser = attendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToList();

        return calls.GroupBy(c => c.AgentId).Select(g =>
        {
            var att = latestByUser.FirstOrDefault(a => a.UserId == g.Key);
            return (object)new
            {
                agent = att?.User != null ? $"{att.User.Prenom} {att.User.Nom}" : g.Key.ToString(),
                first_call = g.Min(c => c.DateHeure),
                last_call = g.Max(c => c.DateHeure),
                total_calls = g.Count(),
                productive_time = (g.Max(c => c.DateHeure) - g.Min(c => c.DateHeure)).TotalMinutes,
                status = att?.Status ?? "offline"
            };
        }).ToList();
    }

    public async Task<List<object>> GetLiveAgentsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var users = await _context.Utilisateurs.AsNoTracking()
            .Where(u => u.Role == "AGENT")
            .ToListAsync();

        var attendances = await _context.AdvancedAttendances.AsNoTracking()
            .Include(a => a.Breaks)
            .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();

        var latestByUser = attendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToList();

        var agentCallCounts = await _context.Appels.AsNoTracking()
            .Where(c => c.DateHeure.Date == today)
            .GroupBy(c => c.AgentId)
            .Select(g => new { AgentId = g.Key, Count = g.Count() })
            .ToListAsync();
        var callMap = agentCallCounts.ToDictionary(x => x.AgentId, x => x.Count);

        return users.Select(u =>
        {
            var att = latestByUser.FirstOrDefault(a => a.UserId == u.Id);
            var openBreak = att?.Breaks?
                .Where(b => b.EndTime == null)
                .OrderByDescending(b => b.Id)
                .FirstOrDefault();

            return (object)new
            {
                id = u.Id,
                name = $"{u.Prenom} {u.Nom}",
                status = att?.Status ?? "offline",
                calls = callMap.TryGetValue(u.Id, out var cnt) ? cnt : 0,
                idleTime = 0,
                score = 0,
                breakType = openBreak?.Type ?? ""
            };
        }).ToList();
    }

    private static string? GenerateSchedulingTip(List<HourlyDataDto> hourly)
    {
        if (hourly.Count == 0) return null;

        var peak = hourly.MaxBy(h => h.Appels);
        var low = hourly.Where(h => h.Appels > 0).MinBy(h => h.Appels);
        var avg = hourly.Average(h => h.Appels);
        var aboveAvg = hourly.Where(h => h.Appels > avg).ToList();
        var peakWindow = aboveAvg.Count >= 2
            ? $"{aboveAvg.Min(h => h.Hour)}h-{aboveAvg.Max(h => h.Hour)}h"
            : null;

        var tips = new List<string>();

        if (peak != null && peak.Appels > avg * 1.5)
            tips.Add($"Heure de pointe détectée à {peak.Hour}h ({peak.Appels} appels). Prévoyez {Math.Max(1, peak.Appels / 10 + 1)} agent(s) supplémentaire(s) sur cette tranche.");

        if (low != null && low.Appels < avg * 0.5 && low.Hour != peak?.Hour)
            tips.Add($"Faible activité à {low.Hour}h ({low.Appels} appels) — envisagez de réduire les effectifs ou de programmer des tâches administratives.");

        if (peakWindow != null)
            tips.Add($"Fenêtre de forte activité: {peakWindow}. Planifiez les pauses en dehors de cette plage pour maintenir la couverture.");

        if (hourly.Count(h => h.Appels == 0) > 0)
        {
            var zeroHours = hourly.Where(h => h.Appels == 0).Select(h => $"{h.Hour}h");
            tips.Add($"Créneaux sans appel: {string.Join(", ", zeroHours)}. Possibilité de regrouper les formations ou briefings d'équipe.");
        }

        return tips.Count > 0 ? string.Join(" ", tips) : null;
    }

    public async Task<ComparisonDto> GetComparisonAsync()
    {
        var now = DateTime.UtcNow;
        var thisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonth = thisMonth.AddMonths(-1);
        var calls = await _context.Appels.AsNoTracking().ToListAsync();

        var thisMonthCalls = calls.Where(c => c.DateHeure >= thisMonth).ToList();
        var lastMonthCalls = calls.Where(c => c.DateHeure >= lastMonth && c.DateHeure < thisMonth).ToList();

        double CalcTotal(System.Collections.Generic.List<Entities.Appel> list) => list.Count;
        double CalcAvg(System.Collections.Generic.List<Entities.Appel> list) => 0;
        double CalcEvolution(double current, double previous) =>
            previous != 0 ? Math.Round(((current - previous) / previous) * 100, 2) : 0;

        var dayCalls = calls.Where(c => c.DateHeure.Date == now.Date).ToList();
        var weekCalls = calls.Where(c => c.DateHeure >= now.AddDays(-7)).ToList();

        var dayAvg = CalcAvg(dayCalls);
        var weekAvg = CalcAvg(weekCalls);
        var monthAvg = CalcAvg(thisMonthCalls);
        var lastMonthAvg = CalcAvg(lastMonthCalls);

        return new ComparisonDto
        {
            Day = new ComparisonPeriodDto
            {
                Total = (int)CalcTotal(dayCalls),
                AvgScore = dayAvg,
                Evolution = 0,
                ScoreEvol = 0
            },
            Week = new ComparisonPeriodDto
            {
                Total = (int)CalcTotal(weekCalls),
                AvgScore = weekAvg,
                Evolution = CalcEvolution(weekCalls.Count, dayCalls.Count),
                ScoreEvol = CalcEvolution(weekAvg, dayAvg)
            },
            Month = new ComparisonPeriodDto
            {
                Total = thisMonthCalls.Count,
                AvgScore = monthAvg,
                Previous = lastMonthCalls.Count,
                PreviousScore = lastMonthAvg,
                Evolution = CalcEvolution(monthAvg, lastMonthAvg),
                ScoreEvol = CalcEvolution(monthAvg, lastMonthAvg)
            }
        };
    }
}
