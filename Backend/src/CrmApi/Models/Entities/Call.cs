using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("calls")]
public class Call
{
    [Key]
    public int Id { get; set; }
    [MaxLength(50)]
    public string AgentId { get; set; } = string.Empty;
    [MaxLength(150)]
    public string AgentName { get; set; } = string.Empty;
    public int AgentPoliteness { get; set; } = 5;
    public float AgentSeconds { get; set; }
    public float AgentTalkRatio { get; set; }
    public string? AgentText { get; set; }
    public int AppointmentConfidence { get; set; }
    [MaxLength(100)]
    public string? AppointmentDate { get; set; }
    [MaxLength(500)]
    public string? AudioFile { get; set; }
    public DateTime? CallDate { get; set; }
    public int? CallDuration { get; set; }
    [MaxLength(50)]
    public string? CallType { get; set; }
    public float ClientSeconds { get; set; }
    public float ClientTalkRatio { get; set; }
    public string? ClientText { get; set; }
    public float? CoherenceScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(100)]
    public string? CustomerIntent { get; set; }
    [MaxLength(20)]
    public string DiarizationMethod { get; set; } = "none";
    public bool InactivityDetected { get; set; }
    public float InactivityDuration { get; set; }
    public string? Keywords { get; set; } // JSONB
    public string? LabeledTranscript { get; set; }
    public int? LeadId { get; set; }
    public string? NextSteps { get; set; }
    public bool ObjectionsHandled { get; set; }
    [MaxLength(50)]
    public string? Performance { get; set; }
    [MaxLength(10)]
    public string? PostalCode { get; set; }
    [MaxLength(200)]
    public string? Problem { get; set; }
    [MaxLength(100)]
    public string? Qualification { get; set; }
    public bool? QualificationCoherence { get; set; }
    public bool? QualificationMatch { get; set; }
    [MaxLength(200)]
    public string? RefusalReason { get; set; }
    public int ScoreAccueil { get; set; }
    public int ScoreArgumentation { get; set; }
    public int ScoreClient { get; set; }
    public int ScoreConclusion { get; set; }
    public int ScoreEcoute { get; set; }
    public int ScoreEfficacite { get; set; }
    public int ScoreEmpathie { get; set; }
    public int ScoreEnergie { get; set; }
    public int ScoreOperateur { get; set; }
    public float ScorePercentage { get; set; }
    public int ScorePersuasion { get; set; }
    public int ScoreRefus { get; set; }
    public int ScoreVente { get; set; }
    public int ScoreVoix { get; set; }
    public bool ScriptRespected { get; set; }
    [MaxLength(20)]
    public string? Sentiment { get; set; }
    public float SentimentScore { get; set; }
    public string? Status { get; set; }
    public string? Summary { get; set; }
    public string? Transcription { get; set; }
    [MaxLength(20)]
    public string? TranscriptionStatus { get; set; }

    [NotMapped]
    public List<string>? KeywordsList { get; set; }
}