using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs.Salary;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/salaries")]
[Authorize(Roles = "ADMIN,QUALITE,SuperAdmin")]
public class SalaryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    public SalaryController(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // ── Liste des salaires ────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetSalaries([FromQuery] string? month)
    {
        var query = _context.SalairesAgents.AsNoTracking().Include(s => s.Agent).AsQueryable();
        if (!string.IsNullOrEmpty(month)) query = query.Where(s => s.Month == month);
        var result = await query.Select(s => new SalaryDto
        {
            Id = s.Id, AgentId = s.AgentId,
            AgentName = s.Agent != null ? $"{s.Agent.Prenom} {s.Agent.Nom}" : "",
            Role = s.Agent != null ? s.Agent.Role : null,
            Month = s.Month, BaseSalary = s.BaseSalary, RdvCount = s.RdvCount,
            PoseCount = s.PoseCount, RefusCount = s.RefusCount, QualityRate = s.QualityRate,
            RdvBonus = s.RdvBonus, PoseBonus = s.PoseBonus, QualityBonus = s.QualityBonus,
            InstallationBonus = s.InstallationBonus, Penalties = s.Penalties,
            TotalSalary = s.TotalSalary, PaymentStatus = s.PaymentStatus
        }).ToListAsync();
        return Ok(result);
    }

    // ── Résumé mensuel ────────────────────────────────────────────────────────
    [HttpGet("monthly-summary")]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] string? month)
    {
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var salaries = await _context.SalairesAgents.AsNoTracking().Where(s => s.Month == month).ToListAsync();
        var best = salaries.OrderByDescending(s => s.TotalSalary).FirstOrDefault();
        string? bestName = null;
        if (best != null)
        {
            var agent = await _context.Utilisateurs.AsNoTracking().FirstOrDefaultAsync(u => u.Id == best.AgentId);
            bestName = agent != null ? $"{agent.Prenom} {agent.Nom}" : null;
        }
        return Ok(new MonthlySummaryDto
        {
            Month = month,
            TotalAgents = await _context.Agents.CountAsync(),
            CalculatedAgents = salaries.Count,
            TotalMass = salaries.Sum(s => s.TotalSalary),
            AvgSalary = salaries.Count > 0 ? salaries.Average(s => s.TotalSalary) : 0,
            MaxSalary = salaries.Count > 0 ? salaries.Max(s => s.TotalSalary) : 0,
            BestAgent = bestName,
            TotalPrimes = salaries.Sum(s => s.RdvBonus + s.PoseBonus + s.QualityBonus + s.InstallationBonus),
            TotalPenalties = salaries.Sum(s => s.Penalties),
            PaymentStatus = salaries.GroupBy(s => s.PaymentStatus).ToDictionary(g => g.Key, g => g.Count())
        });
    }

    // ── Calculer / recalculer tous les salaires ───────────────────────────────
    [HttpGet("calculate")]
    public async Task<IActionResult> Calculate([FromQuery] string? month)
    {
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var parts = month.Split('-');
        var year = int.Parse(parts[0]);
        var monthNumber = int.Parse(parts[1]);
        var agents = (await _context.Utilisateurs.AsNoTracking()
            .Where(u => u.Role == "AGENT")
            .ToListAsync())
            .DistinctBy(u => u.Email)
            .ToList();
        var rules = await _context.SalaryRules.AsNoTracking().Where(r => r.IsActive).ToListAsync();

        float Base(string role) => rules.FirstOrDefault(r => r.RuleType == "base_salary" && r.Role == role)?.Amount
                                ?? rules.FirstOrDefault(r => r.RuleType == "base_salary")?.Amount ?? 1500;
        float RdvBonus()     => rules.FirstOrDefault(r => r.RuleType == "rdv_bonus")?.Amount ?? 50;
        float PoseBonus()    => rules.FirstOrDefault(r => r.RuleType == "pose_bonus")?.Amount ?? 150;
        float QualityBonus() => rules.FirstOrDefault(r => r.RuleType == "quality_bonus")?.Amount ?? 200;
        float InstallBonus() => rules.FirstOrDefault(r => r.RuleType == "installation_bonus")?.Amount ?? 300;
        float RefusPenalty() => rules.FirstOrDefault(r => r.RuleType == "refus_penalty")?.Amount ?? 30;
        float LatePenalty()  => rules.FirstOrDefault(r => r.RuleType == "late_penalty")?.Amount
                             ?? _config.GetValue<float>("WorkSchedule:LatePenaltyPerRetard", 30f);

        // Work-schedule params for retard detection
        int wsHour      = _config.GetValue<int>("WorkSchedule:StartHour", 8);
        int wsMinute    = _config.GetValue<int>("WorkSchedule:StartMinute", 0);
        int wsTolerance = _config.GetValue<int>("WorkSchedule:LateToleranceMinutes", 10);

        // Month date range (UTC)
        var monthStartUtc = DateTime.SpecifyKind(new DateTime(year, monthNumber, 1), DateTimeKind.Utc);
        var monthEndUtc   = DateTime.SpecifyKind(monthStartUtc.AddMonths(1), DateTimeKind.Utc);

        var result = new List<SalaryCalculationDto>();
        foreach (var agent in agents)
        {
            var rdvs = await _context.RendezVous.AsNoTracking()
                .Where(r => r.AgentId == agent.Id && r.DateRendezVous.Year == year && r.DateRendezVous.Month == monthNumber)
                .ToListAsync();
            int rdvCount   = rdvs.Count;
            int poseCount  = rdvs.Count(r => r.Statut == StatutRendezVous.SIGNE);
            int refusCount = rdvs.Count(r => r.Statut == StatutRendezVous.ANNULE || r.Statut == StatutRendezVous.HORS_CIBLE);

            var evals = await _context.ManualEvaluations.AsNoTracking().Where(e => e.AgentId == agent.Id).ToListAsync();
            float qualityRate = evals.Count > 0 ? evals.Average(e => e.GlobalScore) : 0;

            // ── Retard count from attendance ──────────────────────────────────
            var attendances = await _context.AdvancedAttendances.AsNoTracking()
                .Where(a => a.UserId == agent.Id && a.Date >= monthStartUtc && a.Date < monthEndUtc)
                .ToListAsync();

            int retardCount = attendances.Count(a =>
            {
                var localTime = a.ClockIn.ToLocalTime();
                var workStart = localTime.Date.AddHours(wsHour).AddMinutes(wsMinute + wsTolerance);
                return localTime > workStart;
            });
            float retardPenalty = retardCount * LatePenalty();

            // ── Salary calculation ────────────────────────────────────────────
            float baseSalary       = Base("agent");
            float rdvBonus         = rdvCount * RdvBonus();
            float poseBonus        = poseCount * PoseBonus();
            float qualityBonus     = qualityRate >= 70 ? QualityBonus() : qualityRate >= 50 ? QualityBonus() / 2 : 0;
            float installationBonus = poseCount > 0 ? InstallBonus() * poseCount / 10 : 0;
            float penalties        = refusCount * RefusPenalty() + retardPenalty;
            float totalSalary      = baseSalary + rdvBonus + poseBonus + qualityBonus + installationBonus - penalties;

            var existing = await _context.SalairesAgents.FirstOrDefaultAsync(s => s.AgentId == agent.Id && s.Month == month);
            if (existing != null)
            {
                existing.BaseSalary = baseSalary; existing.RdvCount = rdvCount; existing.PoseCount = poseCount;
                existing.RefusCount = refusCount; existing.QualityRate = qualityRate; existing.RdvBonus = rdvBonus;
                existing.PoseBonus = poseBonus; existing.QualityBonus = qualityBonus;
                existing.InstallationBonus = installationBonus; existing.Penalties = penalties; existing.TotalSalary = totalSalary;
            }
            else
            {
                _context.SalairesAgents.Add(new SalaireAgent
                {
                    AgentId = agent.Id, Month = month, BaseSalary = baseSalary, RdvCount = rdvCount,
                    PoseCount = poseCount, RefusCount = refusCount, QualityRate = qualityRate,
                    RdvBonus = rdvBonus, PoseBonus = poseBonus, QualityBonus = qualityBonus,
                    InstallationBonus = installationBonus, Penalties = penalties, TotalSalary = totalSalary
                });
            }
            result.Add(new SalaryCalculationDto
            {
                AgentId = agent.Id, AgentName = $"{agent.Prenom} {agent.Nom}",
                Role = agent.Role, Month = month, BaseSalary = baseSalary, RdvCount = rdvCount,
                PoseCount = poseCount, RefusCount = refusCount, QualityRate = qualityRate,
                RdvBonus = rdvBonus, PoseBonus = poseBonus, QualityBonus = qualityBonus,
                InstallationBonus = installationBonus, Penalties = penalties, TotalSalary = totalSalary,
                RetardCount = retardCount, RetardPenalty = retardPenalty
            });
        }
        await _context.SaveChangesAsync();
        return Ok(result);
    }

    // ── Règles de calcul ──────────────────────────────────────────────────────
    [HttpGet("rules")]
    public async Task<IActionResult> GetRules([FromQuery] string? role)
    {
        var query = _context.SalaryRules.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(role)) query = query.Where(r => r.Role == role);
        var result = await query.Select(r => new SalaryRuleDto
        {
            Id = r.Id, RuleName = r.RuleName, RuleType = r.RuleType, Amount = r.Amount,
            Role = r.Role, IsActive = r.IsActive
        }).ToListAsync();
        return Ok(result);
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] CreateSalaryRuleDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Body requis" });
        var rule = new SalaryRule { RuleName = dto.RuleName, RuleType = dto.RuleType, Amount = dto.Amount, Role = dto.Role ?? "agent", IsActive = dto.IsActive ?? true };
        _context.SalaryRules.Add(rule);
        await _context.SaveChangesAsync();
        return Ok(new SalaryRuleDto { Id = rule.Id, RuleName = rule.RuleName, RuleType = rule.RuleType, Amount = rule.Amount, Role = rule.Role, IsActive = rule.IsActive });
    }

    [HttpPut("rules/{ruleId}")]
    public async Task<IActionResult> UpdateRule(long ruleId, [FromBody] UpdateSalaryRuleDto dto)
    {
        var rule = await _context.SalaryRules.FindAsync(ruleId);
        if (rule == null) return NotFound(new { error = "Règle introuvable" });
        if (dto.RuleName != null) rule.RuleName = dto.RuleName;
        if (dto.RuleType != null) rule.RuleType = dto.RuleType;
        if (dto.Amount != null) rule.Amount = dto.Amount.Value;
        if (dto.Role != null) rule.Role = dto.Role;
        if (dto.IsActive != null) rule.IsActive = dto.IsActive.Value;
        rule.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("rules/{ruleId}")]
    public async Task<IActionResult> DeleteRule(long ruleId)
    {
        var rule = await _context.SalaryRules.FindAsync(ruleId);
        if (rule == null) return NotFound(new { error = "Règle introuvable" });
        _context.SalaryRules.Remove(rule);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ── Salaire détaillé d'un agent ───────────────────────────────────────────
    [HttpGet("{agentId}")]
    public async Task<IActionResult> GetAgentSalary(long agentId, [FromQuery] string? month)
    {
        var agent = await _context.Utilisateurs.AsNoTracking().FirstOrDefaultAsync(u => u.Id == agentId);
        if (agent == null) return NotFound(new { error = "Agent introuvable" });
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var current = await _context.SalairesAgents.AsNoTracking().FirstOrDefaultAsync(s => s.AgentId == agentId && s.Month == month);
        var history = await _context.SalairesAgents.AsNoTracking().Where(s => s.AgentId == agentId).OrderByDescending(s => s.Month).Take(12).ToListAsync();
        var evals = await _context.ManualEvaluations.AsNoTracking().Where(e => e.AgentId == agentId).OrderByDescending(e => e.EvaluationDate).Take(12).ToListAsync();
        return Ok(new
        {
            agent = new { id = agent.Id, name = $"{agent.Prenom} {agent.Nom}", role = agent.Role, email = agent.Email },
            currentSalary = current,
            salaryHistory = history,
            evaluationHistory = evals.Select(e => new { e.Id, e.GlobalScore, e.Decision, e.EvaluationDate })
        });
    }

    // ── Mettre à jour le statut de paiement ───────────────────────────────────
    [HttpPut("{salaryId}/payment")]
    public async Task<IActionResult> UpdatePayment(long salaryId, [FromBody] PaymentStatusDto dto)
    {
        var salary = await _context.SalairesAgents.FindAsync(salaryId);
        if (salary == null) return NotFound(new { error = "Salaire introuvable" });
        salary.PaymentStatus = dto.Status;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
