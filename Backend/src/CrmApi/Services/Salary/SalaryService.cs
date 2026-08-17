using CrmApi.Data;
using CrmApi.DTOs.Salary;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Salary;


public class SalaryService : ISalaryService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public SalaryService(ApplicationDbContext context, IUnitOfWork uow) { _context = context; _uow = uow; }

    public async Task<List<SalaryDto>> GetSalariesAsync(string? month)
    {
        var query = _context.Salaries.AsNoTracking().Include(s => s.Agent).AsQueryable();
        if (!string.IsNullOrEmpty(month)) query = query.Where(s => s.Month == month);
        return await query.Select(s => new SalaryDto { Id = s.Id, AgentId = s.AgentId, AgentName = s.Agent != null ? s.Agent.Name : "", Role = s.Agent != null ? s.Agent.Role.ToString().ToLower() : null, Month = s.Month, BaseSalary = s.BaseSalary, RdvCount = s.RdvCount, PoseCount = s.PoseCount, RefusCount = s.RefusCount, QualityRate = s.QualityRate, RdvBonus = s.RdvBonus, PoseBonus = s.PoseBonus, QualityBonus = s.QualityBonus, InstallationBonus = s.InstallationBonus, Penalties = s.Penalties, TotalSalary = s.TotalSalary, PaymentStatus = s.PaymentStatus }).ToListAsync();
    }

    public async Task<MonthlySummaryDto> GetMonthlySummaryAsync(string? month)
    {
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var salaries = await _context.Salaries.AsNoTracking().Where(s => s.Month == month).ToListAsync();
        var best = salaries.OrderByDescending(s => s.TotalSalary).FirstOrDefault();
        var user = best != null ? await _uow.Users.GetByIdAsync(best.AgentId) : null;
        return new MonthlySummaryDto
        {
            Month = month, TotalAgents = await _context.Users.CountAsync(u => u.Role == UserRole.Agent), CalculatedAgents = salaries.Count,
            TotalMass = salaries.Sum(s => s.TotalSalary), AvgSalary = salaries.Count > 0 ? salaries.Average(s => s.TotalSalary) : 0,
            MaxSalary = salaries.Count > 0 ? salaries.Max(s => s.TotalSalary) : 0, BestAgent = user?.Name,
            TotalPrimes = salaries.Sum(s => s.RdvBonus + s.PoseBonus + s.QualityBonus + s.InstallationBonus),
            TotalPenalties = salaries.Sum(s => s.Penalties),
            PaymentStatus = salaries.GroupBy(s => s.PaymentStatus).ToDictionary(g => g.Key, g => g.Count())
        };
    }

    public async Task<List<SalaryCalculationDto>> CalculateAllSalariesAsync(string? month)
    {
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var agents = await _context.Users.Where(u => u.Role == UserRole.Agent || u.Role == UserRole.Qualite).ToListAsync();
        var result = new List<SalaryCalculationDto>();
        foreach (var agent in agents) result.Add(await CalculateSingleAgentSalaryAsync(agent.Id, month));
        return result;
    }

    private async Task<SalaryCalculationDto> CalculateSingleAgentSalaryAsync(int agentId, string month)
    {
        var parts = month.Split('-');
var year = int.Parse(parts[0]);
var monthNumber = int.Parse(parts[1]);
        var rules = await _context.SalaryRules.AsNoTracking().Where(r => r.IsActive).ToListAsync();
        var baseSalaryRule = rules.FirstOrDefault(r => r.RuleType == "base_salary" && r.Role == "agent") ?? rules.FirstOrDefault(r => r.RuleType == "base_salary");
        var rdvBonusRule = rules.FirstOrDefault(r => r.RuleType == "rdv_bonus");
        var poseBonusRule = rules.FirstOrDefault(r => r.RuleType == "pose_bonus");
        var qualityBonusRule = rules.FirstOrDefault(r => r.RuleType == "quality_bonus");
        var installationBonusRule = rules.FirstOrDefault(r => r.RuleType == "installation_bonus");
        var refusPenaltyRule = rules.FirstOrDefault(r => r.RuleType == "refus_penalty");
        var absencePenaltyRule = rules.FirstOrDefault(r => r.RuleType == "absence_penalty");

        var rdvCount = await _context.CrmAppointments.CountAsync(
    a => a.AgentId == agentId &&
    a.AppointmentDate.Year == year &&
    a.AppointmentDate.Month == monthNumber);
       var poseCount = await _context.CrmAppointments.CountAsync(
    a => a.AgentId == agentId &&
    a.AppointmentDate.Year == year &&
    a.AppointmentDate.Month == monthNumber &&
    (a.Status == "pose" || a.Status == "installed"));
    var refusCount = await _context.CrmAppointments.CountAsync(
    a => a.AgentId == agentId &&
    a.AppointmentDate.Year == year &&
    a.AppointmentDate.Month == monthNumber &&
    a.Status == "refus");
        var evaluations = await _context.ManualEvaluations.AsNoTracking().Where(e => e.AgentId == agentId).ToListAsync();
        float qualityRate = evaluations.Count > 0 ? evaluations.Average(e => e.GlobalScore) : 0;
        if (qualityRate == 0) { var calls = await _context.Calls.AsNoTracking().Where(c => c.AgentId == agentId.ToString()).ToListAsync(); qualityRate = calls.Count > 0 ? calls.Average(c => c.ScorePercentage) : 0; }
        var absenceCount = 0;

        float baseSalary = baseSalaryRule?.Amount ?? 1500;
        float rdvBonus = rdvCount * (rdvBonusRule?.Amount ?? 50);
        float poseBonus = poseCount * (poseBonusRule?.Amount ?? 150);
        float qualityBonus = qualityRate >= 70 ? (qualityBonusRule?.Amount ?? 200) : qualityRate >= 50 ? (qualityBonusRule?.Amount ?? 200) / 2 : 0;
        float installationBonus = poseCount > 0 ? (installationBonusRule?.Amount ?? 300) * poseCount / 10 : 0;
        float penalties = refusCount * (refusPenaltyRule?.Amount ?? 30) + absenceCount * (absencePenaltyRule?.Amount ?? 100);
        float totalSalary = baseSalary + rdvBonus + poseBonus + qualityBonus + installationBonus - penalties;

        var existing = await _context.Salaries.FirstOrDefaultAsync(s => s.AgentId == agentId && s.Month == month);
        if (existing != null)
        {
            existing.BaseSalary = baseSalary; existing.RdvCount = rdvCount; existing.PoseCount = poseCount; existing.RefusCount = refusCount;
            existing.QualityRate = qualityRate; existing.RdvBonus = rdvBonus; existing.PoseBonus = poseBonus; existing.QualityBonus = qualityBonus;
            existing.InstallationBonus = installationBonus; existing.Penalties = penalties; existing.TotalSalary = totalSalary;
            _context.Salaries.Update(existing);
        }
        else
        {
            _context.Salaries.Add(new Models.Entities.Salary { AgentId = agentId, Month = month, BaseSalary = baseSalary, RdvCount = rdvCount, PoseCount = poseCount, RefusCount = refusCount, QualityRate = qualityRate, RdvBonus = rdvBonus, PoseBonus = poseBonus, QualityBonus = qualityBonus, InstallationBonus = installationBonus, Penalties = penalties, TotalSalary = totalSalary });
        }
        await _context.SaveChangesAsync();

        var user = await _uow.Users.GetByIdAsync(agentId);
        return new SalaryCalculationDto { AgentId = agentId, AgentName = user?.Name ?? "", Role = user?.Role.ToString().ToLower(), Month = month, BaseSalary = baseSalary, RdvCount = rdvCount, PoseCount = poseCount, RefusCount = refusCount, QualityRate = qualityRate, RdvBonus = rdvBonus, PoseBonus = poseBonus, QualityBonus = qualityBonus, InstallationBonus = installationBonus, Penalties = penalties, TotalSalary = totalSalary, AbsenceCount = absenceCount };
    }

    public async Task<List<SalaryRuleDto>> GetSalaryRulesAsync(string? role)
    {
        var query = _context.SalaryRules.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(role)) query = query.Where(r => r.Role == role);
        return await query.Select(r => new SalaryRuleDto { Id = r.Id, RuleName = r.RuleName, RuleType = r.RuleType, Amount = r.Amount, Role = r.Role, IsActive = r.IsActive }).ToListAsync();
    }

    public async Task<SalaryRuleDto> CreateSalaryRuleAsync(CreateSalaryRuleDto dto)
    {
        var rule = new Models.Entities.SalaryRule { RuleName = dto.RuleName, RuleType = dto.RuleType, Amount = dto.Amount, Role = dto.Role ?? "agent", IsActive = dto.IsActive ?? true };
        _context.SalaryRules.Add(rule);
        await _context.SaveChangesAsync();
        return new SalaryRuleDto { Id = rule.Id, RuleName = rule.RuleName, RuleType = rule.RuleType, Amount = rule.Amount, Role = rule.Role, IsActive = rule.IsActive };
    }

    public async Task<bool> UpdateSalaryRuleAsync(int ruleId, UpdateSalaryRuleDto dto)
    {
        var rule = await _context.SalaryRules.FindAsync(ruleId);
        if (rule == null) return false;
        if (dto.RuleName != null) rule.RuleName = dto.RuleName;
        if (dto.RuleType != null) rule.RuleType = dto.RuleType;
        if (dto.Amount != null) rule.Amount = dto.Amount.Value;
        if (dto.Role != null) rule.Role = dto.Role;
        if (dto.IsActive != null) rule.IsActive = dto.IsActive.Value;
        _context.SalaryRules.Update(rule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSalaryRuleAsync(int ruleId)
    {
        var rule = await _context.SalaryRules.FindAsync(ruleId);
        if (rule == null) return false;
        _context.SalaryRules.Remove(rule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AgentSalaryDetailDto> GetAgentSalaryDetailAsync(int agentId, string? month)
    {
        var user = await _uow.Users.GetByIdAsync(agentId) ?? throw new KeyNotFoundException("Agent not found");
        month ??= DateTime.UtcNow.ToString("yyyy-MM");
        var currentSalary = await _context.Salaries.AsNoTracking().FirstOrDefaultAsync(s => s.AgentId == agentId && s.Month == month);
        var salaryHistory = await _context.Salaries.AsNoTracking().Where(s => s.AgentId == agentId).OrderByDescending(s => s.Month).Take(12).ToListAsync();
        var evalHistory = await _context.ManualEvaluations.AsNoTracking().Where(e => e.AgentId == agentId).OrderByDescending(e => e.EvaluationDate).Take(12).ToListAsync();
        return new AgentSalaryDetailDto
        {
            Agent = new AgentInfoDto { Id = user.Id, Name = user.Name, Role = user.Role.ToString().ToLower(), Username = user.Username },
            CurrentSalary = currentSalary, SalaryHistory = salaryHistory.Cast<object>().ToList(),
            EvaluationHistory = evalHistory.Cast<object>().ToList(), AttendanceHistory = new List<object>(), AppointmentHistory = new List<object>()
        };
    }

    public async Task<bool> UpdatePaymentStatusAsync(int salaryId, string status)
    {
        var salary = await _context.Salaries.FindAsync(salaryId);
        if (salary == null) return false;
        salary.PaymentStatus = status;
        _context.Salaries.Update(salary);
        await _context.SaveChangesAsync();
        return true;
    }
}
