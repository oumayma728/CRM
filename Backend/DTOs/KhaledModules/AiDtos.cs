namespace Backend.DTOs.Ai;

public class EligibilityRequestDto
{
    public float? Revenus { get; set; }
    public string? Chauffage { get; set; }
    public string? Toiture { get; set; }
    public string? Isolation { get; set; }
    public string? Consommation { get; set; }   // "basse"|"moyenne"|"haute"|"tres_haute"
    public string? CreditScore { get; set; }    // "mauvais"|"moyen"|"bon"|"excellent"
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
    public long? Id { get; set; }
    public long? AgentId { get; set; }
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
    public long? AppointmentId { get; set; }
    public long? AgentId { get; set; }
}
