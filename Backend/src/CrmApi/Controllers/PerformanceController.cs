using CrmApi.Data;
using CrmApi.DTOs.Agent;
using CrmApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/performance")]
public class PerformanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PerformanceController(ApplicationDbContext context) => _context = context;

    [HttpGet("comparison")]
    [Authorize]
    public async Task<IActionResult> GetComparison([FromQuery] string? month, [FromQuery] int? agentId, [FromQuery] string? agentName)
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonth = month ?? now.ToString("yyyy-MM");
            var currentMonthStart = DateTime.SpecifyKind(DateTime.ParseExact(currentMonth + "-01", "yyyy-MM-dd", null), DateTimeKind.Utc);
            var currentMonthEnd = currentMonthStart.AddMonths(1).AddDays(-1);
            var lastMonthStart = currentMonthStart.AddMonths(-1);
            var lastMonthEnd = currentMonthStart.AddDays(-1);

            var callsQuery = _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue);

            if (agentId.HasValue)
                callsQuery = callsQuery.Where(c => c.AgentId == agentId.Value.ToString());
            else if (!string.IsNullOrEmpty(agentName))
                callsQuery = callsQuery.Where(c => c.AgentName == agentName);

            var allCalls = await callsQuery.ToListAsync();

            var thisMonthCalls = allCalls.Where(c => c.CallDate!.Value >= currentMonthStart && c.CallDate!.Value <= currentMonthEnd).ToList();
            var lastMonthCalls = allCalls.Where(c => c.CallDate!.Value >= lastMonthStart && c.CallDate!.Value <= lastMonthEnd).ToList();

            int thisMonthConversions = 0;
            int lastMonthConversions = 0;
            try
            {
                thisMonthConversions = await _context.CrmAppointments.AsNoTracking()
                    .CountAsync(r => r.AppointmentDate >= currentMonthStart && r.AppointmentDate <= currentMonthEnd
                        && (!agentId.HasValue || r.AgentId == agentId.Value));
            }
            catch { }
            try
            {
                lastMonthConversions = await _context.CrmAppointments.AsNoTracking()
                    .CountAsync(r => r.AppointmentDate >= lastMonthStart && r.AppointmentDate <= lastMonthEnd
                        && (!agentId.HasValue || r.AgentId == agentId.Value));
            }
            catch { }

            double GetAvgDuration(List<CrmApi.Models.Entities.Call> list)
            {
                var withDur = list.Where(c => c.CallDuration.HasValue).ToList();
                return withDur.Count > 0 ? Math.Round(withDur.Average(c => c.CallDuration!.Value), 1) : 0;
            }

            var currentMonthData = new PerformanceDataDto
            {
                TotalCalls = thisMonthCalls.Count,
                AvgScore = thisMonthCalls.Count > 0 ? Math.Round(thisMonthCalls.Average(c => (double)c.ScorePercentage), 2) : 0,
                Conversions = thisMonthConversions,
                Refusals = thisMonthCalls.Count(c => c.Sentiment == "NEGATIVE"),
                RefusalRate = thisMonthCalls.Count > 0 ? Math.Round((double)thisMonthCalls.Count(c => c.Sentiment == "NEGATIVE") / thisMonthCalls.Count * 100, 2) : 0,
                AvgDuration = GetAvgDuration(thisMonthCalls)
            };

            var previousMonthData = new PerformanceDataDto
            {
                TotalCalls = lastMonthCalls.Count,
                AvgScore = lastMonthCalls.Count > 0 ? Math.Round(lastMonthCalls.Average(c => (double)c.ScorePercentage), 2) : 0,
                Conversions = lastMonthConversions,
                Refusals = lastMonthCalls.Count(c => c.Sentiment == "NEGATIVE"),
                RefusalRate = lastMonthCalls.Count > 0 ? Math.Round((double)lastMonthCalls.Count(c => c.Sentiment == "NEGATIVE") / lastMonthCalls.Count * 100, 2) : 0,
                AvgDuration = GetAvgDuration(lastMonthCalls)
            };

            double CalcEvol(double curr, double prev) => prev != 0 ? Math.Round((curr - prev) / prev * 100, 1) : 0;

            var evolution = new PerformanceEvolutionDto
            {
                TotalCalls = CalcEvol(currentMonthData.TotalCalls, previousMonthData.TotalCalls),
                AvgScore = CalcEvol(currentMonthData.AvgScore, previousMonthData.AvgScore),
                Conversions = CalcEvol(currentMonthData.Conversions, previousMonthData.Conversions),
                RefusalRate = CalcEvol(currentMonthData.RefusalRate, previousMonthData.RefusalRate),
                AvgDuration = CalcEvol(currentMonthData.AvgDuration, previousMonthData.AvgDuration)
            };

            var monthlyData = new List<MonthlyDataDto>();
            for (int i = 5; i >= 0; i--)
            {
                var mStart = currentMonthStart.AddMonths(-i);
                var mEnd = mStart.AddMonths(1).AddDays(-1);
                var monthCalls = allCalls.Where(c => c.CallDate!.Value >= mStart && c.CallDate!.Value <= mEnd).ToList();
                var rdvCount = monthCalls.Count(c => c.Qualification != null && c.Qualification.Contains("RDV"));

                monthlyData.Add(new MonthlyDataDto
                {
                    Month = mStart.ToString("MMM", new System.Globalization.CultureInfo("fr-FR")),
                    Calls = monthCalls.Count,
                    Score = monthCalls.Count > 0 ? Math.Round(monthCalls.Average(c => (double)c.ScorePercentage), 1) : 0,
                    Conversions = rdvCount,
                    Refusals = monthCalls.Count(c => c.Sentiment == "NEGATIVE")
                });
            }

            var rendementStatus = currentMonthData.AvgScore >= previousMonthData.AvgScore ? "augmenté" : "diminué";
            var mistakes = new List<string>();
            if (currentMonthData.AvgScore < previousMonthData.AvgScore)
                mistakes.Add($"Votre score global a baissé de {Math.Abs(evolution.AvgScore):F1}%.");
            var thisMonthIncoherences = thisMonthCalls.Count(c => c.QualificationMatch == false);
            if (thisMonthIncoherences > 0)
                mistakes.Add($"Plus d'incohérences de qualification ce mois-ci ({thisMonthIncoherences} erreurs).");

            return Ok(new PerformanceComparisonDto
            {
                CurrentMonth = currentMonthData,
                PreviousMonth = previousMonthData,
                Evolution = evolution,
                MonthlyData = monthlyData,
                RendementStatus = rendementStatus,
                Mistakes = mistakes
            });
        }
        catch (FormatException) { return BadRequest(new { error = "Invalid month format. Expected yyyy-MM" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents")]
    [Authorize]
    public async Task<IActionResult> GetAgents([FromQuery] string? month)
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonth = month ?? now.ToString("yyyy-MM");
            var monthStart = DateTime.SpecifyKind(DateTime.ParseExact(currentMonth + "-01", "yyyy-MM-dd", null), DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var calls = await _context.Calls.AsNoTracking()
                .Where(c => c.CallDate.HasValue && c.CallDate!.Value >= monthStart && c.CallDate!.Value <= monthEnd)
                .ToListAsync();

            var agentGroups = calls.GroupBy(c => new { c.AgentId, c.AgentName })
                .OrderByDescending(g => g.Average(c => (double)c.ScorePercentage))
                .ToList();

            var result = new List<object>();
            foreach (var g in agentGroups)
            {
                var agentIdParsed = int.TryParse(g.Key.AgentId, out var aid) ? aid : 0;
                int appointments = 0;
                try
                {
                    appointments = await _context.CrmAppointments.AsNoTracking()
                        .Where(r => r.AgentId == agentIdParsed && r.AppointmentDate >= monthStart && r.AppointmentDate <= monthEnd)
                        .CountAsync();
                }
                catch { }

                var weekActivity = new List<object>();
                for (int i = 6; i >= 0; i--)
                {
                    var day = now.AddDays(-i).Date;
                    var dayCalls = g.Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date == day).ToList();
                    weekActivity.Add(new
                    {
                        day = now.AddDays(-i).ToString("ddd", new System.Globalization.CultureInfo("fr-FR")),
                        calls = dayCalls.Count,
                        convs = dayCalls.Count(c => c.Qualification != null && c.Qualification.Contains("RDV"))
                    });
                }

                result.Add(new
                {
                    id = g.Key.AgentId,
                    name = g.Key.AgentName,
                    current = g.Count(),
                    score = Math.Round(g.Average(c => (double)c.ScorePercentage), 1),
                    conversions = appointments,
                    refusals = g.Count(c => c.Sentiment == "NEGATIVE"),
                    activity = weekActivity
                });
            }

            return Ok(result);
        }
        catch (FormatException) { return BadRequest(new { error = "Invalid month format. Expected yyyy-MM" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents-from-calls")]
    public async Task<IActionResult> GetAgentsFromCalls()
    {
        try
        {
            var result = await _context.Calls.AsNoTracking()
                .GroupBy(c => new { c.AgentId, c.AgentName })
                .Select(g => new { id = g.Key.AgentId, name = g.Key.AgentName, total_calls = g.Count(), avg_score = Math.Round(g.Average(c => c.ScorePercentage), 2) })
                .ToListAsync();
            return Ok(result);
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agent/{id}")]
    [Authorize]
    public async Task<IActionResult> GetAgentPerformance(int id)
    {
        try
        {
            var agent = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == Models.Entities.UserRole.Agent);
            if (agent == null) return NotFound(new { error = "Agent not found" });

            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var prevMonthStart = monthStart.AddMonths(-1);

            var agentIdStr = id.ToString();

            var currentCalls = await _context.Calls.AsNoTracking()
                .Where(c => c.AgentId == agentIdStr && c.CallDate.HasValue && c.CallDate!.Value >= monthStart && c.CallDate!.Value <= now)
                .ToListAsync();

            var previousCalls = await _context.Calls.AsNoTracking()
                .Where(c => c.AgentId == agentIdStr && c.CallDate.HasValue && c.CallDate!.Value >= prevMonthStart && c.CallDate!.Value < monthStart)
                .ToListAsync();

            var currentAppts = await _context.CrmAppointments.AsNoTracking()
                .CountAsync(r => r.AgentId == id && r.AppointmentDate >= monthStart && r.AppointmentDate <= now);

            var prevAppts = await _context.CrmAppointments.AsNoTracking()
                .CountAsync(r => r.AgentId == id && r.AppointmentDate >= prevMonthStart && r.AppointmentDate < monthStart);

            var currentScore = currentCalls.Count > 0 ? Math.Round(currentCalls.Average(c => c.ScorePercentage), 1) : 0;
            var prevScore = previousCalls.Count > 0 ? Math.Round(previousCalls.Average(c => c.ScorePercentage), 1) : 0;

            double GetAvgDuration(List<CrmApi.Models.Entities.Call> list)
            {
                var withDur = list.Where(c => c.CallDuration.HasValue).ToList();
                return withDur.Count > 0 ? Math.Round(withDur.Average(c => c.CallDuration!.Value), 0) : 0;
            }

            var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
            var dailyPerf = new List<int>();
            for (int d = 1; d <= daysInMonth; d++)
            {
                var day = new DateTime(now.Year, now.Month, d, 0, 0, 0, DateTimeKind.Utc);
                if (day > now) break;
                dailyPerf.Add(currentCalls.Count(c => c.CallDate!.Value.Date == day.Date));
            }

            var currentConversionRate = currentCalls.Count > 0 ? Math.Round((double)currentAppts / currentCalls.Count * 100, 1) : 0;
            var prevConversionRate = previousCalls.Count > 0 ? Math.Round((double)prevAppts / previousCalls.Count * 100, 1) : 0;

            var attendance = await _context.Attendances.AsNoTracking()
                .Where(a => a.UserId == id && a.Date >= monthStart && a.Date <= now)
                .ToListAsync();
            var presentDays = attendance.Count(a => a.Status == "active" || a.Status == "break");
            var attendanceRate = daysInMonth > 0 ? Math.Round((double)presentDays / daysInMonth * 100, 1) : 0;

            var result = new
            {
                agent_id = id,
                agent_name = agent.Name,
                current_month = new
                {
                    calls = currentCalls.Count,
                    appointments = currentAppts,
                    conversion_rate = currentConversionRate,
                    avg_call_duration = GetAvgDuration(currentCalls),
                    quality_score = currentScore,
                    attendance_rate = attendanceRate,
                    daily_performance = dailyPerf
                },
                previous_month = new
                {
                    calls = previousCalls.Count,
                    appointments = prevAppts,
                    conversion_rate = prevConversionRate,
                    avg_call_duration = GetAvgDuration(previousCalls),
                    quality_score = prevScore,
                    attendance_rate = 0,
                    daily_performance = new List<int>()
                }
            };

            return Ok(result);
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
