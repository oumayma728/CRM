namespace CrmApi.DTOs.Analytics;

public class OverviewDto
{
    public int TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public Dictionary<string, int> Sentiments { get; set; } = new();
    public Dictionary<string, int> Performances { get; set; } = new();
    public string? BestAgent { get; set; }
    public string? WorstAgent { get; set; }
    public List<HourlyDataDto> Hourly { get; set; } = new();
    public List<RadarDataDto> Radar { get; set; } = new();
    public int CallsToday { get; set; }
    public int ActiveAgents { get; set; }
    public double ConversionRate { get; set; }
    public int PendingFollowups { get; set; }
    public double AvgDuration { get; set; }
    public string? SchedulingTip { get; set; }
}

public class HourlyDataDto
{
    public int Hour { get; set; }
    public int Appels { get; set; }
}

public class RadarDataDto
{
    public string Critere { get; set; } = string.Empty;
    public double Score { get; set; }
}

public class AgentPerformanceDto
{
    public string AgentName { get; set; } = string.Empty;
    public int TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public int Positive { get; set; }
    public int Negative { get; set; }
    public int Neutral { get; set; }
    public double TalkRatio { get; set; }
    public double ClientRatio { get; set; }
}

public class SupervisionDto
{
    public List<RefusalDto> Refusals { get; set; } = new();
    public List<AgentRefusalDto> RefusalsByAgent { get; set; } = new();
    public int IncoherenceCount { get; set; }
    public double CoherenceAvg { get; set; }
    public List<AgentRefusalDto> IncoherencesByAgent { get; set; } = new();
    public int InactivityCount { get; set; }
}

public class RefusalDto
{
    public string Motif { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AgentRefusalDto
{
    public string Agent { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class GeoDto
{
    public List<DeptDto> Departments { get; set; } = new();
    public int TotalLocalized { get; set; }
    public int DeptCount { get; set; }
    public string? TopDept { get; set; }
}

public class DeptDto
{
    public string Dept { get; set; } = string.Empty;
    public int Total { get; set; }
    public double AvgScore { get; set; }
    public double AvgDuration { get; set; }
    public int Confirmed { get; set; }
    public int Refused { get; set; }
    public int Waiting { get; set; }
    public string? PeakHour { get; set; }
    public string? BestAgent { get; set; }
}

public class FollowupStatsDto
{
    public FollowupSummaryDto Stats { get; set; } = new();
    public List<StatusCountDto> ByStatus { get; set; } = new();
    public List<AgentRefusalDto> ByAgent { get; set; } = new();
    public List<object> Followups { get; set; } = new();
}

public class FollowupSummaryDto
{
    public int Total { get; set; }
    public int ARelancer { get; set; }
    public int RelanceEnCours { get; set; }
    public int Convertis { get; set; }
    public double TauxConversion { get; set; }
}

public class StatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CallsLogDto
{
    public int CallId { get; set; }
    public string? AgentName { get; set; }
    public DateTime? CallDate { get; set; }
    public string? Sentiment { get; set; }
    public float ScorePercentage { get; set; }
    public string? Performance { get; set; }
    public string? CustomerIntent { get; set; }
    public bool InactivityDetected { get; set; }
    public string? DiarizationMethod { get; set; }
    public int? CallDuration { get; set; }
    public string? Summary { get; set; }
    public string? NextSteps { get; set; }
    public string? Qualification { get; set; }
}

public class CallsTodayDto
{
    public int CallId { get; set; }
    public string? AgentName { get; set; }
    public DateTime? CallDate { get; set; }
    public int? CallDuration { get; set; }
    public string? Status { get; set; }
    public string? Resultat { get; set; }
    public float ScorePercentage { get; set; }
    public string? Client { get; set; }
    public string? Project { get; set; }
    public string? PostalCode { get; set; }
}

public class ComparisonDto
{
    public ComparisonPeriodDto Day { get; set; } = new();
    public ComparisonPeriodDto Week { get; set; } = new();
    public ComparisonPeriodDto Month { get; set; } = new();
}

public class ComparisonPeriodDto
{
    public int Total { get; set; }
    public double AvgScore { get; set; }
    public int? Previous { get; set; }
    public double? PreviousScore { get; set; }
    public double? Evolution { get; set; }
    public double? ScoreEvol { get; set; }
}
