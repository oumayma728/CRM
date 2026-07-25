namespace Backend.DTOs.Performance;

public class PerformanceDataDto
{
    public int TotalCalls { get; set; }
    public int Conversions { get; set; }
    public double ConversionRate { get; set; }
    public int Refusals { get; set; }
    public double RefusalRate { get; set; }
    public double AvgDuration { get; set; }
}

public class PerformanceEvolutionDto
{
    public double TotalCalls { get; set; }
    public double Conversions { get; set; }
    public double ConversionRate { get; set; }
    public double RefusalRate { get; set; }
    public double AvgDuration { get; set; }
}

public class MonthlyDataDto
{
    public string Month { get; set; } = string.Empty;
    public int Calls { get; set; }
    public int Conversions { get; set; }
    public int Refusals { get; set; }
}

public class PerformanceComparisonDto
{
    public PerformanceDataDto CurrentMonth { get; set; } = new();
    public PerformanceDataDto PreviousMonth { get; set; } = new();
    public PerformanceEvolutionDto Evolution { get; set; } = new();
    public List<MonthlyDataDto> MonthlyData { get; set; } = new();
    public string RendementStatus { get; set; } = string.Empty;
    public List<string> Mistakes { get; set; } = new();
}

public class AgentPerformanceSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Current { get; set; }
    public double Score { get; set; }
    public int Conversions { get; set; }
    public int Refusals { get; set; }
    public List<DayActivityDto> Activity { get; set; } = new();
}

public class DayActivityDto
{
    public string Day { get; set; } = string.Empty;
    public int Calls { get; set; }
    public int Conversions { get; set; }
}
