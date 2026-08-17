using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("crm_appointments")]
public class CrmAppointment
{
    [Key]
    public int Id { get; set; }
    public int AgentId { get; set; }

    [ForeignKey("AgentId")]
    public User? Agent { get; set; }
    public DateTime AppointmentDate { get; set; }
    [MaxLength(10)]
    public string AppointmentTime { get; set; } = string.Empty;
    [MaxLength(50)]
    public string Chauffage { get; set; } = string.Empty;
    [MaxLength(150)]
    public string? ClientEmail { get; set; }
    [MaxLength(150)]
    public string ClientName { get; set; } = string.Empty;
    [MaxLength(30)]
    public string? ClientPhone { get; set; }
    public float Consommation { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreditScore { get; set; }
    [MaxLength(50)]
    public string FinancingStatus { get; set; } = "en_attente";
    [MaxLength(50)]
    public string Isolation { get; set; } = string.Empty;
    public string? Notes { get; set; }
    [MaxLength(50)]
    public string ProjectType { get; set; } = "PV";
    public int QualityScore { get; set; }
    public float Revenus { get; set; }
    [MaxLength(50)]
    public string SituationBancaire { get; set; } = string.Empty;
    [MaxLength(30)]
    public string Status { get; set; } = "pending";
    [MaxLength(50)]
    public string Toiture { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}