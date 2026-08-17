namespace CrmApi.DTOs.Ai;

public class EligibilityRequestDto
{
    public float? Revenus { get; set; }
    public string? Chauffage { get; set; }
    public string? Toiture { get; set; }
    public string? Isolation { get; set; }
    public float? Consommation { get; set; }
    public int? CreditScore { get; set; }
    public string? SituationBancaire { get; set; }
    public string? ProjectType { get; set; }
}

public class EligibilityResultDto
{
    public int Score { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Recommendation { get; set; }
    public Dictionary<string, DetailDto> Details { get; set; } = new();
    public string? ProjectType { get; set; }
    public bool EligibleAides { get; set; }
    public AidesDto AidesEstimees { get; set; } = new();
}

public class DetailDto
{
    public object? Value { get; set; }
    public float Weight { get; set; }
    public string Label { get; set; } = string.Empty;
}

public class AidesDto
{
    public int CEE { get; set; }
    public int CoupDePouce { get; set; }
    public int TvaReduite { get; set; }
    public int EcoPtz { get; set; }
}

public class FakeRdvRequestDto
{
    public int? Id { get; set; }
    public int? AgentId { get; set; }
    public int? QualityScore { get; set; }
    public string? ClientPhone { get; set; }
    public string? AppointmentTime { get; set; }
    public float? Revenus { get; set; }
    public string? Chauffage { get; set; }
    public string? Toiture { get; set; }
}

public class FakeRdvResultDto
{
    public int RiskScore { get; set; }
    public string Verdict { get; set; } = string.Empty;
    public List<string> Flags { get; set; } = new();
    public int? AppointmentId { get; set; }
    public int? AgentId { get; set; }
}

public class AiInsightsDto
{
    public int AgentId { get; set; }
    public AppointmentStatsDto Appointments { get; set; } = new();
    public List<DistributionDto> FinancingDistribution { get; set; } = new();
    public List<DistributionDto> ProjectDistribution { get; set; } = new();
    public CallStatsDto CallStats { get; set; } = new();
    public string? Tip { get; set; }
}

public class AppointmentStatsDto
{
    public int Total { get; set; }
    public double AvgScore { get; set; }
}

public class DistributionDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CallStatsDto
{
    public int TotalCalls { get; set; }
    public double AvgCallScore { get; set; }
}

public class QualificationCheckDto
{
    public string Qualification { get; set; } = string.Empty;
    public string Transcript { get; set; } = string.Empty;
}

public class QualificationResultDto
{
    public bool Coherent { get; set; }
    public string Details { get; set; } = string.Empty;
    public bool RefusalDetected { get; set; }
}

public class RefusalCheckDto
{
    public string Transcript { get; set; } = string.Empty;
}

public class RefusalResultDto
{
    public bool RefusalDetected { get; set; }
    public int Confidence { get; set; }
    public List<string> RefusalKeywords { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public string PrimaryMotive { get; set; } = "none";
    public string SuggestedResponse { get; set; } = string.Empty;
}

public class AppointmentDetectDto
{
    public string Transcript { get; set; } = string.Empty;
}

public class AppointmentDetectResultDto
{
    public bool Detected { get; set; }
    public string? Date { get; set; }
    public int Confidence { get; set; }
    public bool RequiresValidation { get; set; } = true;
}

public class AnonymizeDto
{
    public string Transcript { get; set; } = string.Empty;
}

public class AnonymizeResultDto
{
    public string Anonymized { get; set; } = string.Empty;
}

public class InactivityRequestDto
{
    public int? CallDuration { get; set; }
    public string? Transcription { get; set; }
}

public class InactivityResultDto
{
    public bool InactivityDetected { get; set; }
    public float InactivityDuration { get; set; }
    public string? Reason { get; set; }
}

public class DiarizationRequestDto
{
    public string Transcript { get; set; } = string.Empty;
}

public class DiarizationResultDto
{
    public string LabeledTranscript { get; set; } = string.Empty;
    public string AgentText { get; set; } = string.Empty;
    public string ClientText { get; set; } = string.Empty;
    public float AgentTalkRatio { get; set; }
    public float ClientTalkRatio { get; set; }
    public float AgentSeconds { get; set; }
    public float ClientSeconds { get; set; }
    public string Method { get; set; } = "rule_based";
}

public class SummarizeRequestDto
{
    public string Transcript { get; set; } = string.Empty;
    public string? AgentName { get; set; }
}

public class SummarizeResultDto
{
    public string Summary { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
}

public class ScriptAnalysisRequestDto
{
    public string Transcript { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
}

public class ScriptAnalysisResultDto
{
    public bool ScriptRespected { get; set; }
    public bool ObjectionsHandled { get; set; }
    public int ScoreAccueil { get; set; }
    public int ScoreEnergie { get; set; }
    public int ScoreVoix { get; set; }
    public int ScoreEcoute { get; set; }
    public int ScoreClient { get; set; }
    public int ScoreOperateur { get; set; }
    public int ScoreEfficacite { get; set; }
    public int ScoreConclusion { get; set; }
    public double SentimentScore { get; set; }
    public string Sentiment { get; set; } = "NEUTRAL";
    public double ScorePercentage { get; set; }
    public string Performance { get; set; } = string.Empty;
    public string? NextSteps { get; set; }
    public string? CustomerIntent { get; set; }
}

public class PostalCodeExtractRequestDto
{
    public string Transcript { get; set; } = string.Empty;
}

public class TranscriptionResultDto
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Language { get; set; }
    public double? Duration { get; set; }
    public string? Error { get; set; }
}

public class PostalCodeExtractResultDto
{
    public string? PostalCode { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public bool Extracted { get; set; }
}
