namespace CrmApi.DTOs.Appointment;

public class AppointmentListDto
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhone { get; set; }
    public string? ClientEmail { get; set; }
    public string ProjectType { get; set; } = "PV";
    public DateTime AppointmentDate { get; set; }
    public string AppointmentTime { get; set; } = string.Empty;
    public int QualityScore { get; set; }
    public string FinancingStatus { get; set; } = "en_attente";
    public string? FinancingLabel { get; set; }
    public string? ColorCode { get; set; }
    public string Status { get; set; } = "pending";
    public float Revenus { get; set; }
    public string Chauffage { get; set; } = string.Empty;
    public string Toiture { get; set; } = string.Empty;
    public string Isolation { get; set; } = string.Empty;
    public float Consommation { get; set; }
    public int CreditScore { get; set; }
    public string SituationBancaire { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AppointmentDetailDto : AppointmentListDto
{
    public string? AgentUsername { get; set; }
    public List<object> RecentCalls { get; set; } = new();
}

public class CreateAppointmentDto
{
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhone { get; set; }
    public string? ClientEmail { get; set; }
    public string? ProjectType { get; set; } = "PV";
    public DateTime AppointmentDate { get; set; }
    public string AppointmentTime { get; set; } = string.Empty;
    public string? Status { get; set; }
    public float? Revenus { get; set; }
    public string? Chauffage { get; set; }
    public string? Toiture { get; set; }
    public string? Isolation { get; set; }
    public float? Consommation { get; set; }
    public int? CreditScore { get; set; }
    public string? SituationBancaire { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAppointmentDto
{
    public string? ClientName { get; set; }
    public string? ClientPhone { get; set; }
    public string? ClientEmail { get; set; }
    public string? ProjectType { get; set; }
    public DateTime? AppointmentDate { get; set; }
    public string? AppointmentTime { get; set; }
    public string? Status { get; set; }
    public float? Revenus { get; set; }
    public string? Chauffage { get; set; }
    public string? Toiture { get; set; }
    public string? Isolation { get; set; }
    public float? Consommation { get; set; }
    public int? CreditScore { get; set; }
    public string? SituationBancaire { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAppointmentStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class AppointmentResultDto
{
    public bool Success { get; set; }
    public int Id { get; set; }
    public int QualityScore { get; set; }
    public string Financing { get; set; } = string.Empty;
}
