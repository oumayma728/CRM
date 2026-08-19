namespace CrmApi.DTOs.Call;

public class CallListDto
{
    public int Id { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string? AgentId { get; set; }
    public string? AudioFile { get; set; }
    public string? Transcription { get; set; }
    public string? Sentiment { get; set; }
    public float SentimentScore { get; set; }
    public float ScorePercentage { get; set; }
    public string? Performance { get; set; }
    public string? Summary { get; set; }
    public List<string>? Keywords { get; set; }
    public string? CallType { get; set; }
    public string? Problem { get; set; }
    public string? PostalCode { get; set; }
    public bool ScriptRespected { get; set; }
    public string? CustomerIntent { get; set; }
    public bool ObjectionsHandled { get; set; }
    public int AgentPoliteness { get; set; }
    public string? NextSteps { get; set; }
    public string? AppointmentDate { get; set; }
    public int AppointmentConfidence { get; set; }
    public int ScoreAccueil { get; set; }
    public int ScoreEnergie { get; set; }
    public int ScoreVoix { get; set; }
    public int ScoreEcoute { get; set; }
    public int ScoreClient { get; set; }
    public int ScoreOperateur { get; set; }
    public int ScoreEfficacite { get; set; }
    public int ScoreConclusion { get; set; }
    public float AgentTalkRatio { get; set; }
    public float ClientTalkRatio { get; set; }
    public float AgentSeconds { get; set; }
    public float ClientSeconds { get; set; }
    public string DiarizationMethod { get; set; } = "none";
    public bool InactivityDetected { get; set; }
    public float InactivityDuration { get; set; }
    public string? Qualification { get; set; }
    public DateTime? CallDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CallSaveDto
{
    public int? ContactId { get; set; }
    public string? ContactName { get; set; }
    public string? ContactCompany { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int? Duration { get; set; }
    public string? Besoin { get; set; }
    public string? Budget { get; set; }
    public string? Interet { get; set; }
    public string? Notes { get; set; }
    public string? Statut { get; set; }
    public DateTime? CallDate { get; set; }
}

public class CallsResponseDto
{
    public List<CallListDto> Calls { get; set; } = new();
    public int Total { get; set; }
    public int Limit { get; set; }
    public int Offset { get; set; }
    public string? Role { get; set; }
}

public class CallStatsDto
{
    public int TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public Dictionary<string, int> SentimentDistribution { get; set; } = new();
    public Dictionary<string, int> PerformanceDistribution { get; set; } = new();
    public string? Role { get; set; }
    public string? AgentName { get; set; }
}

public class AgentSummaryDto
{
    public string AgentName { get; set; } = string.Empty;
    public int TotalCalls { get; set; }
    public double AvgScore { get; set; }
    public int PositiveCalls { get; set; }
    public int NegativeCalls { get; set; }
    public int NeutralCalls { get; set; }
}
