using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs.Performance;
using Backend.Entities;
using System.Globalization;

namespace Backend.Controllers;

[ApiController]
[Route("api/performance")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PerformanceController(ApplicationDbContext context) => _context = context;

    [HttpGet("comparison")]
    public async Task<IActionResult> GetComparison([FromQuery] string? month, [FromQuery] long? agentId)
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonth = month ?? now.ToString("yyyy-MM");
            var currentMonthStart = DateTime.ParseExact(currentMonth + "-01", "yyyy-MM-dd", null);
            var currentMonthEnd = currentMonthStart.AddMonths(1).AddDays(-1);
            var lastMonthStart = currentMonthStart.AddMonths(-1);
            var lastMonthEnd = currentMonthStart.AddDays(-1);

            var callsQuery = _context.Appels.AsNoTracking().Include(a => a.Agent).AsQueryable();
            if (agentId.HasValue)
                callsQuery = callsQuery.Where(a => a.AgentId == agentId.Value);

            var allCalls = await callsQuery.ToListAsync();

            var thisMonthCalls = allCalls.Where(a => a.DateHeure >= currentMonthStart && a.DateHeure <= currentMonthEnd).ToList();
            var lastMonthCalls = allCalls.Where(a => a.DateHeure >= lastMonthStart && a.DateHeure <= lastMonthEnd).ToList();

            int thisMonthConversions = 0;
            int lastMonthConversions = 0;
            if (agentId.HasValue)
            {
                thisMonthConversions = await _context.RendezVous.AsNoTracking()
                    .CountAsync(r => r.AgentId == agentId.Value && r.DateRendezVous >= currentMonthStart && r.DateRendezVous <= currentMonthEnd);
                lastMonthConversions = await _context.RendezVous.AsNoTracking()
                    .CountAsync(r => r.AgentId == agentId.Value && r.DateRendezVous >= lastMonthStart && r.DateRendezVous <= lastMonthEnd);
            }

            static double GetAvgDuration(List<Appel> list)
            {
                return list.Count > 0 ? Math.Round(list.Average(a => (double)a.DureeSecondes), 1) : 0;
            }

            var thisMonthRefusals = thisMonthCalls.Count(a => a.Qualification == TypeQualification.REFUS_ABSENCE_COUPLE
                || a.Qualification == TypeQualification.REFUS_HORS_CIBLE_CONSO
                || a.Qualification == TypeQualification.REFUS_PAS_INTERESSE
                || a.Qualification == TypeQualification.REFUS_PAS_DE_PROJET);

            var lastMonthRefusals = lastMonthCalls.Count(a => a.Qualification == TypeQualification.REFUS_ABSENCE_COUPLE
                || a.Qualification == TypeQualification.REFUS_HORS_CIBLE_CONSO
                || a.Qualification == TypeQualification.REFUS_PAS_INTERESSE
                || a.Qualification == TypeQualification.REFUS_PAS_DE_PROJET);

            var thisMonthRdvs = thisMonthCalls.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS);
            var lastMonthRdvs = lastMonthCalls.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS);

            var currentMonthData = new PerformanceDataDto
            {
                TotalCalls = thisMonthCalls.Count,
                Conversions = thisMonthConversions + thisMonthRdvs,
                ConversionRate = thisMonthCalls.Count > 0 ? Math.Round((double)(thisMonthConversions + thisMonthRdvs) / thisMonthCalls.Count * 100, 2) : 0,
                Refusals = thisMonthRefusals,
                RefusalRate = thisMonthCalls.Count > 0 ? Math.Round((double)thisMonthRefusals / thisMonthCalls.Count * 100, 2) : 0,
                AvgDuration = GetAvgDuration(thisMonthCalls)
            };

            var previousMonthData = new PerformanceDataDto
            {
                TotalCalls = lastMonthCalls.Count,
                Conversions = lastMonthConversions + lastMonthRdvs,
                ConversionRate = lastMonthCalls.Count > 0 ? Math.Round((double)(lastMonthConversions + lastMonthRdvs) / lastMonthCalls.Count * 100, 2) : 0,
                Refusals = lastMonthRefusals,
                RefusalRate = lastMonthCalls.Count > 0 ? Math.Round((double)lastMonthRefusals / lastMonthCalls.Count * 100, 2) : 0,
                AvgDuration = GetAvgDuration(lastMonthCalls)
            };

            static double CalcEvol(double curr, double prev) => prev != 0 ? Math.Round((curr - prev) / prev * 100, 1) : 0;

            var evolution = new PerformanceEvolutionDto
            {
                TotalCalls = CalcEvol(currentMonthData.TotalCalls, previousMonthData.TotalCalls),
                Conversions = CalcEvol(currentMonthData.Conversions, previousMonthData.Conversions),
                ConversionRate = CalcEvol(currentMonthData.ConversionRate, previousMonthData.ConversionRate),
                RefusalRate = CalcEvol(currentMonthData.RefusalRate, previousMonthData.RefusalRate),
                AvgDuration = CalcEvol(currentMonthData.AvgDuration, previousMonthData.AvgDuration)
            };

            var monthlyData = new List<MonthlyDataDto>();
            for (int i = 5; i >= 0; i--)
            {
                var mStart = currentMonthStart.AddMonths(-i);
                var mEnd = mStart.AddMonths(1).AddDays(-1);
                var monthCalls = allCalls.Where(a => a.DateHeure >= mStart && a.DateHeure <= mEnd).ToList();
                var monthRdvs = monthCalls.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS);
                var monthRefusals = monthCalls.Count(a => a.Qualification == TypeQualification.REFUS_ABSENCE_COUPLE
                    || a.Qualification == TypeQualification.REFUS_HORS_CIBLE_CONSO
                    || a.Qualification == TypeQualification.REFUS_PAS_INTERESSE
                    || a.Qualification == TypeQualification.REFUS_PAS_DE_PROJET);

                monthlyData.Add(new MonthlyDataDto
                {
                    Month = mStart.ToString("MMM", new CultureInfo("fr-FR")),
                    Calls = monthCalls.Count,
                    Conversions = monthRdvs,
                    Refusals = monthRefusals
                });
            }

            var status = currentMonthData.ConversionRate >= previousMonthData.ConversionRate ? "augmenté" : "diminué";
            var mistakes = new List<string>();
            if (currentMonthData.ConversionRate < previousMonthData.ConversionRate)
                mistakes.Add($"Le taux de conversion a baissé de {Math.Abs(evolution.ConversionRate):F1}%.");

            return Ok(new PerformanceComparisonDto
            {
                CurrentMonth = currentMonthData,
                PreviousMonth = previousMonthData,
                Evolution = evolution,
                MonthlyData = monthlyData,
                RendementStatus = status,
                Mistakes = mistakes
            });
        }
        catch (FormatException) { return BadRequest(new { error = "Invalid month format. Expected yyyy-MM" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agent/{agentId}")]
    public async Task<IActionResult> GetAgentPerformance(long agentId)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var prevMonthStart = monthStart.AddMonths(-1);

        var calls = await _context.Appels.AsNoTracking()
            .Where(a => a.AgentId == agentId)
            .ToListAsync();

        var rdvs = await _context.RendezVous.AsNoTracking()
            .Where(r => r.AgentId == agentId)
            .ToListAsync();

        var agent = await _context.Utilisateurs.AsNoTracking()
            .Where(u => u.Id == agentId)
            .Select(u => $"{u.Prenom} {u.Nom}")
            .FirstOrDefaultAsync() ?? $"Agent #{agentId}";

        var currentCalls = calls.Where(a => a.DateHeure >= monthStart).ToList();
        var prevCalls = calls.Where(a => a.DateHeure >= prevMonthStart && a.DateHeure < monthStart).ToList();
        var currentRdvs = rdvs.Where(r => r.DateRendezVous >= monthStart).ToList();
        var prevRdvs = rdvs.Where(r => r.DateRendezVous >= prevMonthStart && r.DateRendezVous < monthStart).ToList();

        var dailyPerf = Enumerable.Range(0, Math.Min(DateTime.DaysInMonth(now.Year, now.Month), now.Day))
            .Select(d => rdvs.Count(r => r.DateRendezVous.Date == monthStart.AddDays(d).Date))
            .ToArray();

        return Ok(new
        {
            agent_id = agentId,
            agent_name = agent,
            current_month = new
            {
                calls = currentCalls.Count,
                appointments = currentRdvs.Count,
                conversion_rate = currentCalls.Count > 0 ? Math.Round((double)currentRdvs.Count / currentCalls.Count * 100, 1) : 0,
                avg_call_duration = currentCalls.Count > 0 ? Math.Round(currentCalls.Average(a => (double)a.DureeSecondes), 0) : 0,
                quality_score = Math.Round(currentCalls.Count > 0
                    ? currentCalls.Average(a => a.DureeSecondes > 0 ? Math.Min(a.DureeSecondes / 180.0 * 100, 100) : 0)
                    : 0, 1),
                attendance_rate = 100,
                daily_performance = dailyPerf
            },
            previous_month = new
            {
                calls = prevCalls.Count,
                appointments = prevRdvs.Count,
                conversion_rate = prevCalls.Count > 0 ? Math.Round((double)prevRdvs.Count / prevCalls.Count * 100, 1) : 0,
                avg_call_duration = prevCalls.Count > 0 ? Math.Round(prevCalls.Average(a => (double)a.DureeSecondes), 0) : 0,
                quality_score = 0,
                attendance_rate = 0,
                daily_performance = Array.Empty<int>()
            }
        });
    }

    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents([FromQuery] string? month)
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonth = month ?? now.ToString("yyyy-MM");
            var monthStart = DateTime.ParseExact(currentMonth + "-01", "yyyy-MM-dd", null);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var calls = await _context.Appels.AsNoTracking()
                .Include(a => a.Agent)
                .Where(a => a.DateHeure >= monthStart && a.DateHeure <= monthEnd)
                .ToListAsync();

            var agentGroups = calls.GroupBy(a => new { a.AgentId, Name = a.Agent != null ? $"{a.Agent.Prenom} {a.Agent.Nom}".Trim() : $"Agent #{a.AgentId}" })
                .OrderByDescending(g => g.Count())
                .ToList();

            var result = new List<AgentPerformanceSummaryDto>();
            foreach (var g in agentGroups)
            {
                var weekActivity = new List<DayActivityDto>();
                for (int i = 6; i >= 0; i--)
                {
                    var day = now.AddDays(-i).Date;
                    var dayCalls = g.Where(a => a.DateHeure.Date == day).ToList();
                    weekActivity.Add(new DayActivityDto
                    {
                        Day = now.AddDays(-i).ToString("ddd", new CultureInfo("fr-FR")),
                        Calls = dayCalls.Count,
                        Conversions = dayCalls.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS)
                    });
                }

                result.Add(new AgentPerformanceSummaryDto
                {
                    Id = g.Key.AgentId.ToString(),
                    Name = g.Key.Name,
                    Current = g.Count(),
                    Score = Math.Round(g.Average(a => (double)a.DureeSecondes), 1),
                    Conversions = g.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS),
                    Refusals = g.Count(a => a.Qualification == TypeQualification.REFUS_ABSENCE_COUPLE
                        || a.Qualification == TypeQualification.REFUS_HORS_CIBLE_CONSO
                        || a.Qualification == TypeQualification.REFUS_PAS_INTERESSE
                        || a.Qualification == TypeQualification.REFUS_PAS_DE_PROJET),
                    Activity = weekActivity
                });
            }

            return Ok(result);
        }
        catch (FormatException) { return BadRequest(new { error = "Invalid month format. Expected yyyy-MM" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
