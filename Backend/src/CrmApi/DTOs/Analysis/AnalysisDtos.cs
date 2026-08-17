namespace CrmApi.DTOs.Analysis;

public class AnalysisResultDto
{
    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Sentiment { get; set; } = "NEUTRAL";
    public double SentimentScore { get; set; }
    public double ScorePercentage { get; set; }
    public string Performance { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = new();
    public bool AppointmentDetected { get; set; }
    public string? AppointmentDate { get; set; }
    public int CallDuration { get; set; }
    public double AgentTalkRatio { get; set; }
    public double ClientTalkRatio { get; set; }
    public int ScoreAccueil { get; set; }
    public int ScoreEnergie { get; set; }
    public int ScoreVoix { get; set; }
    public int ScoreEcoute { get; set; }
    public int ScoreClient { get; set; }
    public int ScoreOperateur { get; set; }
    public int ScoreEfficacite { get; set; }
    public int ScoreConclusion { get; set; }
    public bool InactivityDetected { get; set; }
    public float InactivityDuration { get; set; }
    public string? InactivityReason { get; set; }
    public bool RefusalDetected { get; set; }
    public string? RefusalMotive { get; set; }
    public string? SuggestedResponse { get; set; }
    public bool TranscriptAnonymized { get; set; }
    public bool ScriptRespected { get; set; }
    public bool? QualificationMatch { get; set; }
    public string? Qualification { get; set; }
    public string? RefusalReason { get; set; }
    public int AgentPoliteness { get; set; } = 5;
    public string? LabeledTranscript { get; set; }
    public string? NextSteps { get; set; }
    public string? CustomerIntent { get; set; }
    public bool ObjectionsHandled { get; set; }
    public string? Transcription { get; set; }
}

public class ExportRequestDto
{
    public string? Entity { get; set; }
    public string? Format { get; set; }
    public string? Filter { get; set; }
    public string? Month { get; set; }
}
