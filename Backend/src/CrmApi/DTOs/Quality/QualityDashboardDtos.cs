namespace CrmApi.DTOs.Quality;

public class TeamStatusCardDto
{
    public int OnlineCount { get; set; }
    public int BreakCount { get; set; }
    public int OfflineCount { get; set; }
    public int TotalAgents { get; set; }
    public List<TeamMemberCardDto> Members { get; set; } = new();
}

public class TeamMemberCardDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "offline";
    public string? BreakType { get; set; }
    public DateTime? ClockIn { get; set; }
    public DateTime? BreakStart { get; set; }
}

public class AgentStateRowDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "offline";
    public DateTime? ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public string? CurrentBreakType { get; set; }
    public DateTime? CurrentBreakStart { get; set; }
    public int TotalBreakMinutes { get; set; }
    public double HoursWorked { get; set; }
}

public class GlobalStatsDto
{
    public double AvgQualityScore { get; set; }
    public double ComplianceRate { get; set; }
    public int TotalCallsAnalyzed { get; set; }
    public int ActiveAlerts { get; set; }
    public int TotalAgents { get; set; }
    public int PresentToday { get; set; }
    public int TotalRdvToday { get; set; }
    public int TotalRdvMonth { get; set; }
    public List<DailyTrendDto> WeeklyTrends { get; set; } = new();
}

public class DailyTrendDto
{
    public string Day { get; set; } = string.Empty;
    public double AvgScore { get; set; }
    public int RdvCount { get; set; }
}

public class QualityAlertItemDto
{
    public int Id { get; set; }
    public string Type { get; set; } = "info";
    public string Agent { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class EvaluationHistoryRowDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string Agent { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public float Score { get; set; }
    public string? Decision { get; set; }
    public string? Evaluator { get; set; }
}

public class AgentDetailDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double AvgQualityScore { get; set; }
    public int TotalCalls { get; set; }
    public double AvgCallScore { get; set; }
    public int RdvThisMonth { get; set; }
    public double ConversionRate { get; set; }
    public string Trend { get; set; } = "stable";
    public List<EvaluationHistoryRowDto> RecentEvaluations { get; set; } = new();
    public List<RadarSkillDto> SkillsProfile { get; set; } = new();
    public List<QualificationDistributionDto> QualificationDistribution { get; set; } = new();
}

public class RadarSkillDto
{
    public string Subject { get; set; } = string.Empty;
    public double A { get; set; }
    public int FullMark { get; set; } = 100;
}

public class QualificationDistributionDto
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class RdvJourDto
{
    public int TotalToday { get; set; }
    public int Objectif { get; set; }
    public double Taux { get; set; }
    public List<RdvAgentDto> ByAgent { get; set; } = new();
}

public class RdvAgentDto
{
    public int AgentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int RdvCount { get; set; }
    public int Objectif { get; set; }
    public double Taux { get; set; }
}

public class DashboardComparisonDto
{
    public ComparisonPeriodDto? Day { get; set; }
    public ComparisonPeriodDto? Week { get; set; }
    public ComparisonPeriodDto? Month { get; set; }
}

public class ComparisonPeriodDto
{
    public double Evolution { get; set; }
    public double CurrentAvgScore { get; set; }
    public double CurrentTotalCalls { get; set; }
    public double PreviousAvgScore { get; set; }
    public double ScoreEvol { get; set; }
}
