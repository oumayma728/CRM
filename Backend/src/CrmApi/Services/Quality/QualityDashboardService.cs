using CrmApi.Data;
using CrmApi.DTOs.Quality;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Quality;

public class QualityDashboardService : IQualityDashboardService
{
    private readonly ApplicationDbContext _context;

    public QualityDashboardService(ApplicationDbContext context) => _context = context;

    public async Task<TeamStatusCardDto> GetTeamStatusAsync()
    {
        var today = DateTime.UtcNow.Date;
        var agents = await _context.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Agent)
            .ToListAsync();

        var todayAttendances = await _context.Attendances.AsNoTracking()
            .Include(a => a.Breaks)
            .Where(a => a.Date.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();

        var latestByUser = todayAttendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToList();

        var memberCards = new List<TeamMemberCardDto>();
        var onlineCount = 0;
        var breakCount = 0;

        foreach (var agent in agents)
        {
            var att = latestByUser.FirstOrDefault(a => a.UserId == agent.Id);
            if (att == null)
                continue;

            var currentBreak = att.Breaks
                .Where(b => b.EndTime == null)
                .OrderByDescending(b => b.Id)
                .FirstOrDefault();
            var isOnBreak = att.Status == "break" && currentBreak != null;

            if (isOnBreak)
                breakCount++;
            else if (att.Status == "active")
                onlineCount++;

            memberCards.Add(new TeamMemberCardDto
            {
                UserId = agent.Id,
                Name = agent.Name,
                Status = isOnBreak ? "break" : att.Status,
                BreakType = currentBreak?.Type,
                ClockIn = att.ClockIn,
                BreakStart = currentBreak?.StartTime
            });
        }

        var offlineCount = agents.Count - onlineCount - breakCount;

        return new TeamStatusCardDto
        {
            OnlineCount = onlineCount,
            BreakCount = breakCount,
            OfflineCount = offlineCount,
            TotalAgents = agents.Count,
            Members = memberCards
        };
    }

    public async Task<List<AgentStateRowDto>> GetAgentsStateAsync()
    {
        var today = DateTime.UtcNow.Date;
        var agents = await _context.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Agent)
            .ToListAsync();

        var todayAttendances = await _context.Attendances.AsNoTracking()
            .Include(a => a.Breaks)
            .Where(a => a.Date.Date == today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();

        var latestByUser = todayAttendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToDictionary(a => a.UserId);

        var result = new List<AgentStateRowDto>();

        foreach (var agent in agents)
        {
            latestByUser.TryGetValue(agent.Id, out var att);
            var currentBreak = att?.Breaks
                .Where(b => b.EndTime == null)
                .OrderByDescending(b => b.Id)
                .FirstOrDefault();
            var totalBreakMin = att?.Breaks.Where(b => b.EndTime != null).Sum(b => b.DurationMinutes) ?? 0;

            var hoursWorked = 0.0;
            if (att != null)
            {
                var end = att.ClockOut ?? DateTime.UtcNow;
                hoursWorked = Math.Max(0, (end - att.ClockIn).TotalHours - totalBreakMin / 60.0);
            }

            result.Add(new AgentStateRowDto
            {
                UserId = agent.Id,
                Name = agent.Name,
                Status = att == null ? "offline" : (att.Status == "break" ? "break" : att.Status),
                ClockIn = att?.ClockIn,
                ClockOut = att?.ClockOut,
                CurrentBreakType = currentBreak?.Type,
                CurrentBreakStart = currentBreak?.StartTime,
                TotalBreakMinutes = totalBreakMin,
                HoursWorked = Math.Round(hoursWorked, 2)
            });
        }

        return result;
    }

    public async Task<GlobalStatsDto> GetGlobalStatsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-6);

        var agents = await _context.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Agent)
            .ToListAsync();
        var agentIds = agents.Select(a => a.Id).ToList();
        var agentNames = agents.Select(a => a.Name).ToList();

        var callsToday = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date == today && agentNames.Contains(c.AgentName))
            .ToListAsync();

        var allCalls = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && agentNames.Contains(c.AgentName))
            .ToListAsync();

        var avgQuality = allCalls.Count > 0 ? Math.Round(allCalls.Average(c => c.ScorePercentage), 1) : 0;

        var compliantCalls = allCalls.Count(c => c.ScorePercentage >= 70);
        var complianceRate = allCalls.Count > 0 ? Math.Round((double)compliantCalls / allCalls.Count * 100, 1) : 0;

        var alertCount = await _context.AlertHistories.AsNoTracking()
            .CountAsync(h => h.CreatedAt.Date == today);

        var todayAttendances = await _context.Attendances.AsNoTracking()
            .Where(a => a.Date.Date == today && (a.Status == "active" || a.Status == "break"))
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToListAsync();

        var presentToday = todayAttendances.Count;

        var rdvToday = await _context.CrmAppointments.AsNoTracking()
            .Where(r => r.AppointmentDate.Date == today)
            .ToListAsync();

        var monthStart = new DateTime(
    today.Year,
    today.Month,
    1,
    0,
    0,
    0,
    DateTimeKind.Utc
);

        var rdvMonth = await _context.CrmAppointments.AsNoTracking()
            .Where(r => r.AppointmentDate >= monthStart && r.AppointmentDate <= today)
            .ToListAsync();

        var weeklyTrends = new List<DailyTrendDto>();
        for (int i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            var dayCalls = allCalls.Where(c => c.CallDate!.Value.Date == day).ToList();
            var dayRdv = await _context.CrmAppointments.AsNoTracking()
                .Where(r => r.AppointmentDate.Date == day)
                .CountAsync();

            weeklyTrends.Add(new DailyTrendDto
            {
                Day = day.ToString("ddd", new System.Globalization.CultureInfo("fr-FR")),
                AvgScore = dayCalls.Count > 0 ? Math.Round(dayCalls.Average(c => c.ScorePercentage), 1) : 0,
                RdvCount = dayRdv
            });
        }

        return new GlobalStatsDto
        {
            AvgQualityScore = avgQuality,
            ComplianceRate = complianceRate,
            TotalCallsAnalyzed = callsToday.Count,
            ActiveAlerts = alertCount,
            TotalAgents = agents.Count,
            PresentToday = presentToday,
            TotalRdvToday = rdvToday.Count,
            TotalRdvMonth = rdvMonth.Count,
            WeeklyTrends = weeklyTrends
        };
    }

    public async Task<List<QualityAlertItemDto>> GetDashboardAlertsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var alerts = new List<QualityAlertItemDto>();

        var historyAlerts = await _context.AlertHistories.AsNoTracking()
            .Where(h => h.CreatedAt.Date == today || h.CreatedAt.Date == today.AddDays(-1))
            .OrderByDescending(h => h.CreatedAt)
            .Take(20)
            .ToListAsync();

        foreach (var h in historyAlerts)
        {
            alerts.Add(new QualityAlertItemDto
            {
                Id = h.Id,
                Type = h.Severity == "error" ? "critical" : h.Severity,
                Agent = h.AgentName,
                Message = h.Message ?? string.Empty,
                Category = MapAlertTypeToCategory(h.AlertType),
                CreatedAt = h.CreatedAt
            });
        }

        var todayAttendances = await _context.Attendances.AsNoTracking()
            .Include(a => a.Breaks)
            .Include(a => a.User)
            .Where(a => a.Date.Date == today)
            .ToListAsync();

        foreach (var att in todayAttendances)
        {
            var longBreak = att.Breaks.FirstOrDefault(b => b.EndTime != null && b.DurationMinutes > 60);
            if (longBreak != null)
            {
                alerts.Add(new QualityAlertItemDto
                {
                    Id = (int)(-(att.Id * 10 + longBreak.Id)),
                    Type = "warning",
                    Agent = att.User?.Name ?? "Unknown",
                    Message = $"Pause déjeuner dépassée de {longBreak.DurationMinutes - 60} minutes",
                    Category = "pointage",
                    CreatedAt = longBreak.StartTime
                });
            }

            var activeBreak = att.Breaks.FirstOrDefault(b => b.EndTime == null);
            if (activeBreak != null)
            {
                var breakMinutes = (DateTime.UtcNow - activeBreak.StartTime).TotalMinutes;
                var breakRule = await _context.AlertRules.AsNoTracking()
                    .FirstOrDefaultAsync(r => r.RuleType == "long_break" && r.IsActive);
                var threshold = breakRule?.ThresholdValue ?? 90;
                if (breakMinutes > threshold && att.Status == "break")
                {
                    alerts.Add(new QualityAlertItemDto
                    {
                        Id = (int)(-(att.Id * 100)),
                        Type = "warning",
                        Agent = att.User?.Name ?? "Unknown",
                        Message = $"Pause en cours depuis {Math.Round(breakMinutes)} minutes (seuil: {threshold}min)",
                        Category = "pointage",
                        CreatedAt = activeBreak.StartTime
                    });
                }
            }
        }

        var activeAgents = await _context.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Agent)
            .Select(u => u.Name)
            .ToListAsync();

        var inactiveThreshold = 45;
        var inactivityRule = await _context.AlertRules.AsNoTracking()
            .FirstOrDefaultAsync(r => r.RuleType == "inactivity" && r.IsActive);
        if (inactivityRule != null) inactiveThreshold = (int)inactivityRule.ThresholdValue;

        var recentCalls = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date == today && activeAgents.Contains(c.AgentName))
            .GroupBy(c => c.AgentName)
            .Select(g => new { AgentName = g.Key, LastCall = g.Max(c => c.CallDate!.Value) })
            .ToListAsync();

        var presentAgentNames = todayAttendances
            .Where(a => a.Status == "active" || a.Status == "break")
            .Select(a => a.User?.Name)
            .Where(n => n != null)
            .ToHashSet();
        foreach (var agentName in presentAgentNames)
        {
            if (!recentCalls.Any(r => r.AgentName == agentName))
            {
                var att = todayAttendances.FirstOrDefault(a => a.User?.Name == agentName);
                if (att != null)
                {
                    var inactiveMin = (DateTime.UtcNow - att.ClockIn).TotalMinutes;
                    if (inactiveMin > inactiveThreshold)
                    {
                        alerts.Add(new QualityAlertItemDto
                        {
                            Id = (int)(-(att.Id * 1000)),
                            Type = "critical",
                            Agent = agentName ?? "Unknown",
                            Message = $"Aucun appel depuis {Math.Round(inactiveMin)} minutes (inactivité)",
                            Category = "activite",
                            CreatedAt = att.ClockIn.AddMinutes(inactiveThreshold)
                        });
                    }
                }
            }
            else
            {
                var lastCall = recentCalls.First(r => r.AgentName == agentName).LastCall;
                var minSinceLastCall = (DateTime.UtcNow - lastCall).TotalMinutes;
                if (minSinceLastCall > inactiveThreshold)
                {
                    alerts.Add(new QualityAlertItemDto
                    {
                        Id = (int)(-(todayAttendances.First(a => a.User?.Name == agentName).Id * 10000)),
                        Type = "warning",
                        Agent = agentName ?? "Unknown",
                        Message = $"Aucun appel depuis {Math.Round(minSinceLastCall)} minutes (inactivité)",
                        Category = "activite",
                        CreatedAt = lastCall.AddMinutes(inactiveThreshold)
                    });
                }
            }
        }

        return alerts.OrderByDescending(a => a.CreatedAt).ToList();
    }

    public async Task<List<EvaluationHistoryRowDto>> GetEvaluationHistoryAsync(int limit, int offset)
    {
        return await _context.ManualEvaluations.AsNoTracking()
            .Include(e => e.Agent)
            .Include(e => e.Evaluator)
            .OrderByDescending(e => e.EvaluationDate)
            .Skip(offset)
            .Take(limit)
            .Select(e => new EvaluationHistoryRowDto
            {
                Id = e.Id,
                Date = e.EvaluationDate,
                Agent = e.Agent != null ? e.Agent.Name : "Unknown",
                Type = e.CallRef != null ? "Évaluation IA" : "Évaluation manuelle",
                Score = e.GlobalScore,
                Decision = e.Decision,
                Evaluator = e.Evaluator != null ? e.Evaluator.Name : "Système"
            })
            .ToListAsync();
    }

    public async Task<AgentDetailDto> GetAgentDetailAsync(int agentId)
    {
        var agent = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == agentId && u.Role == UserRole.Agent);
        if (agent == null) throw new KeyNotFoundException($"Agent {agentId} not found");

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(
            today.Year,
            today.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);
        var lastMonthEnd = monthStart.AddDays(-1);

        var allCalls = await _context.Calls.AsNoTracking()
            .Where(c => c.AgentName == agent.Name)
            .ToListAsync();

        var monthCalls = allCalls.Where(c => c.CallDate.HasValue && c.CallDate!.Value >= monthStart && c.CallDate!.Value <= today).ToList();
        var lastMonthCalls = allCalls.Where(c => c.CallDate.HasValue && c.CallDate!.Value >= lastMonthStart && c.CallDate!.Value <= lastMonthEnd).ToList();

        var avgScore = allCalls.Count > 0 ? Math.Round(allCalls.Average(c => c.ScorePercentage), 1) : 0;
        var avgCallScore = monthCalls.Count > 0 ? Math.Round(monthCalls.Average(c => c.ScorePercentage), 1) : 0;

        var rdvThisMonth = await _context.CrmAppointments.AsNoTracking()
            .Where(r => r.AgentId == agentId && r.AppointmentDate >= monthStart && r.AppointmentDate <= today)
            .CountAsync();

        var conversionRate = monthCalls.Count > 0 ? Math.Round((double)rdvThisMonth / monthCalls.Count * 100, 1) : 0;

        var trend = "stable";
        if (lastMonthCalls.Count > 0 && monthCalls.Count > 0)
        {
            var monthAvg = monthCalls.Average(c => c.ScorePercentage);
            var lastAvg = lastMonthCalls.Average(c => c.ScorePercentage);
            if (monthAvg > lastAvg + 2) trend = "up";
            else if (monthAvg < lastAvg - 2) trend = "down";
        }

        var recentEvals = await _context.ManualEvaluations.AsNoTracking()
            .Include(e => e.Evaluator)
            .Where(e => e.AgentId == agentId)
            .OrderByDescending(e => e.EvaluationDate)
            .Take(10)
            .Select(e => new EvaluationHistoryRowDto
            {
                Id = e.Id,
                Date = e.EvaluationDate,
                Agent = agent.Name,
                Type = e.CallRef != null ? "Évaluation IA" : "Évaluation manuelle",
                Score = e.GlobalScore,
                Decision = e.Decision,
                Evaluator = e.Evaluator != null ? e.Evaluator.Name : "Système"
            })
            .ToListAsync();

        // Calculate competencies profile from manual evaluations
        var evalsForRadar = await _context.ManualEvaluations.AsNoTracking()
            .Where(e => e.AgentId == agentId)
            .ToListAsync();

        double sumAccueil = 0, sumEnergie = 0, sumVoix = 0, sumEcoute = 0;
        double sumClient = 0, sumOpe = 0, sumEfficacite = 0, sumConclusion = 0;
        int countAccueil = 0, countEnergie = 0, countVoix = 0, countEcoute = 0;
        int countClient = 0, countOpe = 0, countEfficacite = 0, countConclusion = 0;

        foreach (var ev in evalsForRadar)
        {
            if (string.IsNullOrEmpty(ev.ScoresJson)) continue;
            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, double>>(ev.ScoresJson);
                if (dict == null) continue;

                double GetVal(params string[] keys)
                {
                    foreach (var k in keys)
                    {
                        if (dict.TryGetValue(k, out var v)) return v;
                    }
                    return -1;
                }

                // Accueil
                double acc1 = GetVal("score_accueil", "accueil");
                double acc2 = GetVal("accueil_formule");
                double acc3 = GetVal("accueil_sourire");
                if (acc1 >= 0) { sumAccueil += acc1; countAccueil++; }
                else if (acc2 >= 0 || acc3 >= 0)
                {
                    double accSum = 0; int accC = 0;
                    if (acc2 >= 0) { accSum += acc2; accC++; }
                    if (acc3 >= 0) { accSum += acc3; accC++; }
                    sumAccueil += accSum / accC;
                    countAccueil++;
                }

                // Energie
                double nrg = GetVal("score_energie", "energie");
                if (nrg >= 0) { sumEnergie += nrg; countEnergie++; }

                // Voix
                double vox = GetVal("score_voix", "voix");
                if (vox >= 0) { sumVoix += vox; countVoix++; }

                // Ecoute
                double eco1 = GetVal("score_ecoute", "ecoute");
                double eco2 = GetVal("decouverte_ecoute");
                if (eco1 >= 0) { sumEcoute += eco1; countEcoute++; }
                else if (eco2 >= 0) { sumEcoute += eco2; countEcoute++; }

                // Client
                double clt = GetVal("score_client", "client", "decouverte_besoin");
                if (clt >= 0) { sumClient += clt; countClient++; }

                // Ope
                double ope1 = GetVal("score_ope", "ope");
                double ope2 = GetVal("argumentaire_maitrise");
                double ope3 = GetVal("argumentaire_objection");
                if (ope1 >= 0) { sumOpe += ope1; countOpe++; }
                else if (ope2 >= 0 || ope3 >= 0)
                {
                    double sumO = 0; int cO = 0;
                    if (ope2 >= 0) { sumO += ope2; cO++; }
                    if (ope3 >= 0) { sumO += ope3; cO++; }
                    sumOpe += sumO / cO;
                    countOpe++;
                }

                // Efficacite
                double eff = GetVal("score_efficacite", "efficacite", "closing_recap");
                if (eff >= 0) { sumEfficacite += eff; countEfficacite++; }

                // Conclusion
                double ccl1 = GetVal("score_conclusion", "conclusion");
                double ccl2 = GetVal("closing_conge");
                if (ccl1 >= 0) { sumConclusion += ccl1; countConclusion++; }
                else if (ccl2 >= 0) { sumConclusion += ccl2; countConclusion++; }
            }
            catch { }
        }

        var skillsProfile = new List<RadarSkillDto>
        {
            new() { Subject = "Accueil", A = countAccueil > 0 ? Math.Round((sumAccueil / countAccueil) * 20.0, 1) : 0 },
            new() { Subject = "Énergie", A = countEnergie > 0 ? Math.Round((sumEnergie / countEnergie) * 20.0, 1) : 0 },
            new() { Subject = "Voix", A = countVoix > 0 ? Math.Round((sumVoix / countVoix) * 20.0, 1) : 0 },
            new() { Subject = "Écoute", A = countEcoute > 0 ? Math.Round((sumEcoute / countEcoute) * 20.0, 1) : 0 },
            new() { Subject = "Client", A = countClient > 0 ? Math.Round((sumClient / countClient) * 20.0, 1) : 0 },
            new() { Subject = "Ope", A = countOpe > 0 ? Math.Round((sumOpe / countOpe) * 20.0, 1) : 0 },
            new() { Subject = "Efficacité", A = countEfficacite > 0 ? Math.Round((sumEfficacite / countEfficacite) * 20.0, 1) : 0 },
            new() { Subject = "Conclusion", A = countConclusion > 0 ? Math.Round((sumConclusion / countConclusion) * 20.0, 1) : 0 }
        };

        // Calculate qualifications distribution from Calls
        int totalCallsCount = allCalls.Count;
        int countRdv = allCalls.Count(c => c.Qualification != null && c.Qualification.Contains("RDV"));
        int countRefus = allCalls.Count(c => c.Qualification != null && c.Qualification.Contains("REFUS"));
        int countRappel = allCalls.Count(c => c.Qualification != null && c.Qualification.Contains("RAPPEL"));
        int countRepondeur = allCalls.Count(c => c.Qualification != null && c.Qualification.Contains("REPONDEUR"));
        int countHorsCible = allCalls.Count(c => c.Qualification != null && c.Qualification.Contains("HORS_CIBLE"));

        double pctRdv = totalCallsCount > 0 ? Math.Round((double)countRdv / totalCallsCount * 100, 1) : 0;
        double pctRefus = totalCallsCount > 0 ? Math.Round((double)countRefus / totalCallsCount * 100, 1) : 0;
        double pctRappel = totalCallsCount > 0 ? Math.Round((double)countRappel / totalCallsCount * 100, 1) : 0;
        double pctRepondeur = totalCallsCount > 0 ? Math.Round((double)countRepondeur / totalCallsCount * 100, 1) : 0;
        double pctHorsCible = totalCallsCount > 0 ? Math.Round((double)countHorsCible / totalCallsCount * 100, 1) : 0;

        var qualifDistribution = new List<QualificationDistributionDto>
        {
            new() { Name = "RDV", Value = pctRdv, Color = "#10b981" },
            new() { Name = "Refus", Value = pctRefus, Color = "#ef4444" },
            new() { Name = "Rappel", Value = pctRappel, Color = "#f59e0b" },
            new() { Name = "Répondeur", Value = pctRepondeur, Color = "#64748b" },
            new() { Name = "Hors cible", Value = pctHorsCible, Color = "#3b82f6" }
        };

        return new AgentDetailDto
        {
            UserId = agentId,
            Name = agent.Name,
            AvgQualityScore = avgScore,
            TotalCalls = allCalls.Count,
            AvgCallScore = avgCallScore,
            RdvThisMonth = rdvThisMonth,
            ConversionRate = conversionRate,
            Trend = trend,
            RecentEvaluations = recentEvals,
            SkillsProfile = skillsProfile,
            QualificationDistribution = qualifDistribution
        };
    }

    public async Task<RdvJourDto> GetRdvJourAsync()
    {
        var today = DateTime.UtcNow.Date;
        var agents = await _context.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Agent)
            .ToListAsync();

        var rdvToday = await _context.CrmAppointments.AsNoTracking()
            .Where(r => r.AppointmentDate.Date == today)
            .ToListAsync();

        var objectif = 15;
        var byAgent = new List<RdvAgentDto>();

        foreach (var agent in agents)
        {
            var count = rdvToday.Count(r => r.AgentId == agent.Id);
            byAgent.Add(new RdvAgentDto
            {
                AgentId = agent.Id,
                Name = agent.Name,
                RdvCount = count,
                Objectif = objectif,
                Taux = Math.Round((double)count / objectif * 100, 1)
            });
        }

        var totalRdv = rdvToday.Count;
        var totalObjectif = agents.Count * objectif;

        return new RdvJourDto
        {
            TotalToday = totalRdv,
            Objectif = totalObjectif,
            Taux = totalObjectif > 0 ? Math.Round((double)totalRdv / totalObjectif * 100, 1) : 0,
            ByAgent = byAgent
        };
    }

    public async Task<DashboardComparisonDto> GetComparisonAsync()
    {
        var today = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var lastWeekStart = weekStart.AddDays(-7);
        var monthStart = new DateTime(
    today.Year,
    today.Month,
    1,
    0,
    0,
    0,
    DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);
        var lastMonthEnd = monthStart.AddDays(-1);

        var dayComp = await BuildPeriodComparison(yesterday, today);
        var weekComp = await BuildPeriodComparison(lastWeekStart, weekStart.AddDays(-1), weekStart, today);
        var monthComp = await BuildPeriodComparison(lastMonthStart, lastMonthEnd, monthStart, today);

        return new DashboardComparisonDto
        {
            Day = dayComp,
            Week = weekComp,
            Month = monthComp
        };
    }

    private async Task<ComparisonPeriodDto?> BuildPeriodComparison(DateTime prevStart, DateTime prevEnd, DateTime currStart, DateTime currEnd)
    {
        var prevCalls = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date >= prevStart && c.CallDate!.Value.Date <= prevEnd)
            .ToListAsync();
        var currCalls = await _context.Calls.AsNoTracking()
            .Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date >= currStart && c.CallDate!.Value.Date <= currEnd)
            .ToListAsync();

        var prevAvg = prevCalls.Count > 0 ? prevCalls.Average(c => c.ScorePercentage) : 0;
        var currAvg = currCalls.Count > 0 ? currCalls.Average(c => c.ScorePercentage) : 0;

        var evolution = prevCalls.Count > 0 ? Math.Round((currCalls.Count - prevCalls.Count) / (double)prevCalls.Count * 100, 1) : 0;
        var scoreEvol = prevAvg > 0 ? Math.Round((currAvg - prevAvg) / prevAvg * 100, 1) : 0;

        return new ComparisonPeriodDto
        {
            Evolution = evolution,
            CurrentAvgScore = Math.Round(currAvg, 1),
            CurrentTotalCalls = currCalls.Count,
            PreviousAvgScore = Math.Round(prevAvg, 1),
            ScoreEvol = scoreEvol
        };
    }

    private async Task<ComparisonPeriodDto?> BuildPeriodComparison(DateTime prevStart, DateTime currStart)
    {
        return await BuildPeriodComparison(prevStart, currStart.AddDays(-1), currStart, DateTime.UtcNow.Date);
    }

    private static string MapAlertTypeToCategory(string alertType)
    {
        return alertType switch
        {
            "low_score" => "qualite",
            "inactivity" => "activite",
            "conversion" => "performance",
            "long_break" => "pointage",
            _ => "general"
        };
    }
}
