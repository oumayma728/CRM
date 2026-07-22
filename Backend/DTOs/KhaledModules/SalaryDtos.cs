namespace Backend.DTOs.Salary;

public class SalaryDto
{
    public long Id { get; set; }
    public long AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string Month { get; set; } = string.Empty;
    public float BaseSalary { get; set; }
    public int RdvCount { get; set; }
    public int PoseCount { get; set; }
    public int RefusCount { get; set; }
    public float QualityRate { get; set; }
    public float RdvBonus { get; set; }
    public float PoseBonus { get; set; }
    public float QualityBonus { get; set; }
    public float InstallationBonus { get; set; }
    public float Penalties { get; set; }
    public float TotalSalary { get; set; }
    public string PaymentStatus { get; set; } = "pending";
}

public class SalaryCalculationDto
{
    public long AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string Month { get; set; } = string.Empty;
    public float BaseSalary { get; set; }
    public int RdvCount { get; set; }
    public int PoseCount { get; set; }
    public int RefusCount { get; set; }
    public float QualityRate { get; set; }
    public float RdvBonus { get; set; }
    public float PoseBonus { get; set; }
    public float QualityBonus { get; set; }
    public float InstallationBonus { get; set; }
    public float Penalties { get; set; }
    public float TotalSalary { get; set; }
    /// <summary>Nombre de retards ce mois</summary>
    public int RetardCount { get; set; }
    /// <summary>Pénalité totale retard (TND)</summary>
    public float RetardPenalty { get; set; }
}

public class MonthlySummaryDto
{
    public string Month { get; set; } = string.Empty;
    public int TotalAgents { get; set; }
    public int CalculatedAgents { get; set; }
    public float TotalMass { get; set; }
    public float AvgSalary { get; set; }
    public float MaxSalary { get; set; }
    public string? BestAgent { get; set; }
    public float TotalPrimes { get; set; }
    public float TotalPenalties { get; set; }
    public Dictionary<string, int> PaymentStatus { get; set; } = new();
}

public class SalaryRuleDto
{
    public long Id { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public float Amount { get; set; }
    public string Role { get; set; } = "agent";
    public bool IsActive { get; set; } = true;
}

public class CreateSalaryRuleDto
{
    public string RuleName { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public float Amount { get; set; }
    public string? Role { get; set; } = "agent";
    public bool? IsActive { get; set; } = true;
}

public class UpdateSalaryRuleDto
{
    public string? RuleName { get; set; }
    public string? RuleType { get; set; }
    public float? Amount { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class PaymentStatusDto
{
    public string Status { get; set; } = string.Empty;
}
