using System.Text.Json;

namespace CrmApi.DTOs.Agent;

public class AgentSimpleDto
{
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
}

public class AgentSaveDto
{
    public string? Notes { get; set; }
    public int? CallsCount { get; set; }
    public int? ConversionsCount { get; set; }
    public int? RdvCount { get; set; }
    public JsonElement? ActivityLog { get; set; }
    public string? Chauffage { get; set; }
    public string? Revenus { get; set; }
    public string? Budget { get; set; }
    public string? Interet { get; set; }
}

public class AgentPerformanceDetailDto
{
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public PerformancePeriodDto CurrentMonth { get; set; } = new();
    public PerformancePeriodDto PreviousMonth { get; set; } = new();
}

public class PerformancePeriodDto
{
    public int Calls { get; set; }
    public int Appointments { get; set; }
    public double ConversionRate { get; set; }
    public double AvgCallDuration { get; set; }
    public double QualityScore { get; set; }
    public double AttendanceRate { get; set; }
    public List<int> DailyPerformance { get; set; } = new();
}

public class PerformanceComparisonDto
{
    public PerformanceDataDto CurrentMonth { get; set; } = new();
    public PerformanceDataDto PreviousMonth { get; set; } = new();
    public PerformanceEvolutionDto Evolution { get; set; } = new();
    public List<MonthlyDataDto> MonthlyData { get; set; } = new();
    public string? RendementStatus { get; set; }
    public List<string> Mistakes { get; set; } = new();
}

public class PerformanceDataDto
{
    public int TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public int Conversions { get; set; }
    public int Refusals { get; set; }
    public double RefusalRate { get; set; }
    public double AvgDuration { get; set; }
}

public class PerformanceEvolutionDto
{
    public double TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public double Conversions { get; set; }
    public double RefusalRate { get; set; }
    public double AvgDuration { get; set; }
}

public class MonthlyDataDto
{
    public string Month { get; set; } = string.Empty;
    public int Calls { get; set; }
    public double Score { get; set; }
    public int Conversions { get; set; }
    public int Refusals { get; set; }
}
