using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("appointments")]
public class Appointment
{
    [Key]
    public int Id { get; set; }
    [MaxLength(50)]
    public string AgentIdRef { get; set; } = string.Empty;
    public int CallId { get; set; }

    [ForeignKey("CallId")]
    public Call? Call { get; set; }
    [MaxLength(100)]
    public string? ClientName { get; set; }
    [MaxLength(20)]
    public string? ClientPhone { get; set; }
    public int ConfidenceScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(100)]
    public string? DetectedDate { get; set; }
    public DateTime? FinalDate { get; set; }
    public string? Notes { get; set; }
    [MaxLength(20)]
    public string Status { get; set; } = "detected";
}