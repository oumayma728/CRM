using CrmApi.DTOs.Salary;

namespace CrmApi.Services.Salary;

public interface ISalaryService
{
    Task<List<SalaryDto>> GetSalariesAsync(string? month);
    Task<MonthlySummaryDto> GetMonthlySummaryAsync(string? month);
    Task<List<SalaryCalculationDto>> CalculateAllSalariesAsync(string? month);
    Task<List<SalaryRuleDto>> GetSalaryRulesAsync(string? role);
    Task<SalaryRuleDto> CreateSalaryRuleAsync(CreateSalaryRuleDto dto);
    Task<bool> UpdateSalaryRuleAsync(int ruleId, UpdateSalaryRuleDto dto);
    Task<bool> DeleteSalaryRuleAsync(int ruleId);
    Task<AgentSalaryDetailDto> GetAgentSalaryDetailAsync(int agentId, string? month);
    Task<bool> UpdatePaymentStatusAsync(int salaryId, string status);
}
