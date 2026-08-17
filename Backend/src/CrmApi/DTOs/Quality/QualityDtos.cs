namespace CrmApi.DTOs.Quality;

public class CreateEvaluationDto
{
    public int AgentId { get; set; }
    public string? CallRef { get; set; }
    public DateTime? CallDate { get; set; }
    public float? GlobalScore { get; set; }
    public string? Decision { get; set; }
    public string? Commentaires { get; set; }
    public Dictionary<string, int>? Scores { get; set; }
}

public class EvaluationDto
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string? AgentName { get; set; }
    public int EvaluatorId { get; set; }
    public string? EvaluatorName { get; set; }
    public DateTime EvaluationDate { get; set; }
    public string? CallRef { get; set; }
    public float GlobalScore { get; set; }
    public string? Decision { get; set; }
    public string? Commentaires { get; set; }
    public string? ScoresJson { get; set; }
}

public class QualityStatsDto
{
    public int Total { get; set; }
    public double AvgScore { get; set; }
    public Dictionary<string, int> ByDecision { get; set; } = new();
}
