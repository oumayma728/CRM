using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

/// <summary>Évaluation manuelle d'un agent par le service qualité</summary>
public class ManualEvaluation
{
    [Key]
    public int Id { get; set; }

    public int AgentId { get; set; }
    public int EvaluatorId { get; set; }

    [MaxLength(100)]
    public string? CallRef { get; set; }

    public float GlobalScore { get; set; }

    [MaxLength(50)]
    public string? Decision { get; set; }

    public string? Commentaires { get; set; }

    /// <summary>Scores par critère sérialisés en JSON</summary>
    public string? ScoresJson { get; set; }

    public DateTime EvaluationDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(AgentId))]
    [InverseProperty(nameof(User.ReceivedEvaluations))]
    public virtual User? Agent { get; set; }

    [ForeignKey(nameof(EvaluatorId))]
    [InverseProperty(nameof(User.GivenEvaluations))]
    public virtual User? Evaluator { get; set; }
}