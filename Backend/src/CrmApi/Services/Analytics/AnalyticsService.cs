using CrmApi.Data;
using CrmApi.DTOs.Analytics;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;

    public AnalyticsService(ApplicationDbContext context) => _context = context;

    public async Task<OverviewDto> GetOverviewAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        var today = DateTime.UtcNow.Date;
        var callsToday = calls.Count(c => c.CallDate.HasValue && c.CallDate.Value.Date == today);

        var avgDuration = 0.0;
        var callsWithDuration = calls.Where(c => c.CallDuration.HasValue).ToList();
        if (callsWithDuration.Count > 0)
            avgDuration = Math.Round(callsWithDuration.Average(c => c.CallDuration!.Value), 1);

        var followups = await _context.Followups.AsNoTracking().ToListAsync();
        var pendingFollowups = followups.Count(f => f.Status == "a_relancer");

        var thisMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthCalls = calls.Count(c => c.CallDate.HasValue && c.CallDate.Value >= thisMonth);
        var monthAppointments = await _context.CrmAppointments.AsNoTracking()
            .CountAsync(r => r.AppointmentDate >= thisMonth && r.AppointmentDate <= today);
        var conversionRate = monthCalls > 0 ? Math.Round((double)monthAppointments / monthCalls * 100, 1) : 0;

        var hourly = calls.Where(c => c.CallDate.HasValue).GroupBy(c => c.CallDate!.Value.Hour).Select(g => new HourlyDataDto { Hour = g.Key, Appels = g.Count() }).OrderBy(h => h.Hour).ToList();

        var schedulingTip = GenerateSchedulingTip(hourly);

        return new OverviewDto
        {
            TotalCalls = calls.Count,
            AvgScore = calls.Count > 0 ? Math.Round(calls.Average(c => c.ScorePercentage), 2) : 0,
            Sentiments = calls.GroupBy(c => c.Sentiment ?? "NEUTRAL").ToDictionary(g => g.Key, g => g.Count()),
            Performances = calls.GroupBy(c => c.Performance ?? "N/A").ToDictionary(g => g.Key, g => g.Count()),
            BestAgent = calls.GroupBy(c => c.AgentName).OrderByDescending(g => g.Average(c => c.ScorePercentage)).FirstOrDefault()?.Key,
            WorstAgent = calls.GroupBy(c => c.AgentName).OrderBy(g => g.Average(c => c.ScorePercentage)).FirstOrDefault()?.Key,
            Hourly = hourly,
            Radar = new List<RadarDataDto>
            {
                new() { Critere = "Accueil", Score = calls.Count > 0 ? calls.Average(c => c.ScoreAccueil) : 0 },
                new() { Critere = "Energie", Score = calls.Count > 0 ? calls.Average(c => c.ScoreEnergie) : 0 },
                new() { Critere = "Voix", Score = calls.Count > 0 ? calls.Average(c => c.ScoreVoix) : 0 },
                new() { Critere = "Ecoute", Score = calls.Count > 0 ? calls.Average(c => c.ScoreEcoute) : 0 },
                new() { Critere = "Client", Score = calls.Count > 0 ? calls.Average(c => c.ScoreClient) : 0 },
                new() { Critere = "Operateur", Score = calls.Count > 0 ? calls.Average(c => c.ScoreOperateur) : 0 },
                new() { Critere = "Efficacite", Score = calls.Count > 0 ? calls.Average(c => c.ScoreEfficacite) : 0 },
                new() { Critere = "Conclusion", Score = calls.Count > 0 ? calls.Average(c => c.ScoreConclusion) : 0 }
            },
            CallsToday = callsToday,
            ActiveAgents = calls.Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today).Select(c => c.AgentName).Distinct().Count(),
            ConversionRate = conversionRate,
            PendingFollowups = pendingFollowups,
            AvgDuration = avgDuration,
            SchedulingTip = schedulingTip
        };
    }

    public async Task<List<AgentPerformanceDto>> GetAgentsPerformanceAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        return calls.GroupBy(c => c.AgentName).Select(g => new AgentPerformanceDto
        {
            AgentName = g.Key,
            TotalCalls = g.Count(),
            AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 2),
            Positive = g.Count(c => c.Sentiment == "POSITIVE"),
            Negative = g.Count(c => c.Sentiment == "NEGATIVE"),
            Neutral = g.Count(c => c.Sentiment == "NEUTRAL"),
            TalkRatio = Math.Round(g.Average(c => c.AgentTalkRatio), 3),
            ClientRatio = Math.Round(g.Average(c => c.ClientTalkRatio), 3)
        }).ToList();
    }

    public async Task<SupervisionDto> GetSupervisionAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        return new SupervisionDto
        {
            Refusals = calls.Where(c => !string.IsNullOrEmpty(c.RefusalReason)).GroupBy(c => c.RefusalReason!).Select(g => new RefusalDto { Motif = g.Key, Count = g.Count() }).ToList(),
            RefusalsByAgent = calls.Where(c => !string.IsNullOrEmpty(c.RefusalReason)).GroupBy(c => c.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList(),
            IncoherenceCount = calls.Count(c => c.QualificationMatch == false),
            CoherenceAvg = calls.Where(c => c.CoherenceScore.HasValue).Count() > 0 ? Math.Round(calls.Where(c => c.CoherenceScore.HasValue).Average(c => c.CoherenceScore!.Value), 2) : 0,
            IncoherencesByAgent = calls.Where(c => c.QualificationMatch == false).GroupBy(c => c.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList(),
            InactivityCount = calls.Count(c => c.InactivityDetected)
        };
    }

    public async Task<GeoDto> GetGeoAsync()
    {
        var calls = await _context.Calls.AsNoTracking().Where(c => !string.IsNullOrEmpty(c.PostalCode)).ToListAsync();
        var depts = calls.GroupBy(c => c.PostalCode!.Length >= 2 ? c.PostalCode!.Substring(0, 2) : c.PostalCode!).Select(g =>
        {
            var callsWithDuration = g.Where(c => c.CallDuration.HasValue).ToList();
            var callsWithDate = g.Where(c => c.CallDate.HasValue).ToList();
            var statusCounts = g.Where(c => !string.IsNullOrEmpty(c.Status)).GroupBy(c => c.Status!.ToLower()).ToDictionary(gr => gr.Key, gr => gr.Count());
            var agentScores = g.Where(c => !string.IsNullOrEmpty(c.AgentName)).GroupBy(c => c.AgentName!).Select(ag => new { Agent = ag.Key, Avg = ag.Average(c => c.ScorePercentage), Count = ag.Count() }).ToList();
            var bestAgent = agentScores.OrderByDescending(a => a.Avg).ThenByDescending(a => a.Count).FirstOrDefault();
            var peakHour = callsWithDate.GroupBy(c => c.CallDate!.Value.Hour).OrderByDescending(h => h.Count()).FirstOrDefault();

            return new DeptDto
            {
                Dept = g.Key,
                Total = g.Count(),
                AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 2),
                AvgDuration = callsWithDuration.Count > 0
                    ? Math.Round(callsWithDuration.Average(c => c.CallDuration!.Value), 1)
                    : 0,
                Confirmed = statusCounts.GetValueOrDefault("confirmed", 0) + statusCounts.GetValueOrDefault("confirme", 0),
                Refused = statusCounts.GetValueOrDefault("cancelled", 0) + statusCounts.GetValueOrDefault("refus", 0),
                Waiting = statusCounts.GetValueOrDefault("pending", 0) + statusCounts.GetValueOrDefault("en_attente", 0),
                PeakHour = peakHour != null ? $"{peakHour.Key}h" : null,
                BestAgent = bestAgent?.Agent
            };
        }).OrderByDescending(d => d.Total).ToList();
        return new GeoDto { Departments = depts, TotalLocalized = calls.Count, DeptCount = depts.Count, TopDept = depts.FirstOrDefault()?.Dept };
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
                TauxConversion = followups.Count > 0 ? Math.Round((double)followups.Count(f => f.Status == "converti") / followups.Count * 100, 2) : 0
            },
            ByStatus = followups.GroupBy(f => f.Status ?? "unknown").Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() }).ToList(),
            ByAgent = followups.GroupBy(f => f.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList()
        };
    }

    public async Task<List<CallsLogDto>> GetCallsLogAsync(int limit, string? agentName = null)
    {
        var query = _context.Calls.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(agentName))
            query = query.Where(c => c.AgentName == agentName);
        return await query.OrderByDescending(c => c.CallDate).Take(limit).Select(c => new CallsLogDto
        {
            CallId = c.Id,
            AgentName = c.AgentName,
            CallDate = c.CallDate,
            Sentiment = c.Sentiment,
            ScorePercentage = c.ScorePercentage,
            Performance = c.Performance,
            CustomerIntent = c.CustomerIntent,
            InactivityDetected = c.InactivityDetected,
            DiarizationMethod = c.DiarizationMethod,
            CallDuration = c.CallDuration,
            Summary = c.Summary,
            NextSteps = c.NextSteps,
            Qualification = c.Qualification
        }).ToListAsync();
    }

    public async Task<List<CallsTodayDto>> GetCallsTodayAsync()
    {
        var today = DateTime.UtcNow.Date;
        var calls = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today)
            .OrderByDescending(c => c.CallDate)
            .ToListAsync();

        var leadIds = calls.Where(c => c.LeadId.HasValue).Select(c => c.LeadId!.Value).Distinct().ToList();
        var leads = await _context.Leads.AsNoTracking()
            .Where(l => leadIds.Contains(l.Id))
            .ToDictionaryAsync(l => l.Id);

        return calls.Select(c =>
        {
            var lead = c.LeadId.HasValue && leads.ContainsKey(c.LeadId.Value) ? leads[c.LeadId.Value] : null;
            return new CallsTodayDto
            {
                CallId = c.Id,
                AgentName = c.AgentName,
                CallDate = c.CallDate,
                CallDuration = c.CallDuration,
                Status = c.Status,
                Resultat = c.Performance ?? c.Sentiment,
                ScorePercentage = c.ScorePercentage,
                Client = lead?.ContactName ?? c.PostalCode ?? "N/A",
                Project = lead?.CampaignName ?? "",
                PostalCode = c.PostalCode
            };
        }).ToList();
    }

    public async Task<List<object>> GetPointageAsync()
    {
        var today = DateTime.UtcNow.Date;
        var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today).ToListAsync();

        var allAttendances = await _context.Attendances.AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();
        var attendances = allAttendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToList();

        return calls.GroupBy(c => c.AgentName).Select(g =>
        {
            var agentName = g.Key;
            var attendance = attendances.FirstOrDefault(a => a.User?.Name == agentName);
            return (object)new
            {
                agent = agentName,
                first_call = g.Min(c => c.CallDate),
                last_call = g.Max(c => c.CallDate),
                total_calls = g.Count(),
                productive_time = (g.Max(c => c.CallDate) - g.Min(c => c.CallDate))?.TotalMinutes ?? 0,
                status = attendance?.Status ?? "offline"
            };
        }).ToList();
    }

    public async Task<List<object>> GetLiveAgentsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var now = DateTime.UtcNow;
        var users = await _context.Users.AsNoTracking()
            .Where(u => u.Role == Models.Entities.UserRole.Agent)
            .ToListAsync();

        var allAttendances = await _context.Attendances.AsNoTracking()
            .Include(a => a.Breaks)
            .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();
        var latestByUser = allAttendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToList();

        var agentCallCounts = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today)
            .GroupBy(c => c.AgentName)
            .Select(g => new { Name = g.Key, Count = g.Count(), AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 1), LastCall = g.Max(c => c.CallDate) })
            .ToListAsync();

        var qualityScores = await _context.ManualEvaluations.AsNoTracking()
            .Where(e => e.EvaluationDate.Date == today)
            .GroupBy(e => e.AgentId)
            .Select(g => new { AgentId = g.Key, AvgScore = Math.Round(g.Average(e => e.GlobalScore), 1) })
            .ToListAsync();

        var agentProjects = await _context.Campaigns.AsNoTracking()
            .Where(c => !c.IsDeleted && c.Status == Models.Entities.CampaignStatus.Active)
            .SelectMany(c => c.CampaignAgents)
            .Where(ca => ca.IsActive)
            .GroupBy(ca => ca.UserId)
            .Select(g => new { UserId = g.Key, Project = g.Select(ca => ca.Campaign!.Name).FirstOrDefault() })
            .ToListAsync();

        return users.Select(u =>
        {
            var att = latestByUser.FirstOrDefault(a => a.UserId == u.Id);
            var openBreak = att?.Breaks?.Where(b => b.EndTime == null).OrderByDescending(b => b.Id).FirstOrDefault();
            var callData = agentCallCounts.FirstOrDefault(c => c.Name == u.Name);
            var quality = qualityScores.FirstOrDefault(q => q.AgentId == u.Id);
            var project = agentProjects.FirstOrDefault(p => p.UserId == u.Id);

            var workMinutes = 0.0;
            var breakMinutes = 0.0;
            if (att != null)
            {
                var end = att.ClockOut ?? now;
                workMinutes = (end - att.ClockIn).TotalMinutes;
                breakMinutes = att.Breaks.Sum(b => b.DurationMinutes > 0 ? b.DurationMinutes :
                    (b.EndTime.HasValue ? (b.EndTime.Value - b.StartTime).TotalMinutes : (now - b.StartTime).TotalMinutes));
            }

            var scoreIa = callData?.AvgScore ?? 0;
            var scoreQualite = quality?.AvgScore ?? 0;
            var scoreGlobal = callData != null && quality != null
                ? Math.Round((scoreIa + scoreQualite) / 2, 1)
                : Math.Max(scoreIa, scoreQualite);

            return (object)new
            {
                id = u.Id,
                name = u.Name,
                status = att?.Status ?? "offline",
                calls = callData?.Count ?? 0,
                idleTime = 0,
                score = scoreGlobal,
                score_ia = scoreIa,
                score_qualite = scoreQualite,
                breakType = openBreak?.Type ?? "",
                clock_in = att?.ClockIn,
                work_duration_minutes = att != null ? (int)Math.Max(0, workMinutes - breakMinutes) : 0,
                break_start = openBreak?.StartTime,
                break_duration_minutes = openBreak != null ? (int)Math.Max(0, (now - openBreak.StartTime).TotalMinutes) : 0,
                total_break_minutes = (int)Math.Max(0, breakMinutes),
                project = project?.Project ?? "",
                last_activity = callData?.LastCall,
                clock_out = att?.ClockOut
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
        var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue).ToListAsync();

        var thisMonthCalls = calls.Where(c => c.CallDate!.Value >= thisMonth).ToList();
        var lastMonthCalls = calls.Where(c => c.CallDate!.Value >= lastMonth && c.CallDate!.Value < thisMonth).ToList();

        double CalcTotal(List<Models.Entities.Call> list) => list.Count;
       double CalcAvg(List<Models.Entities.Call> list) =>
    list.Count > 0
        ? Math.Round(list.Average(c => (double)c.ScorePercentage), 2)
        : 0;
        double CalcEvolution(double current, double previous) =>
            previous != 0 ? Math.Round(((current - previous) / previous) * 100, 2) : 0;

        var dayCalls = calls.Where(c => c.CallDate!.Value.Date == now.Date).ToList();
        var weekCalls = calls.Where(c => c.CallDate!.Value >= now.AddDays(-7)).ToList();

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
