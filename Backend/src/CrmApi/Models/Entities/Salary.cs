using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("salaries")]
public class Salary
{
    [Key]
    public int Id { get; set; }
    public int AgentId { get; set; }

    [ForeignKey("AgentId")]
    public User? Agent { get; set; }
    public float BaseSalary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public float InstallationBonus { get; set; }
    [MaxLength(7)]
    public string Month { get; set; } = string.Empty;
    [MaxLength(20)]
    public string PaymentStatus { get; set; } = "pending";
    public float Penalties { get; set; }
    public float PoseBonus { get; set; }
    public int PoseCount { get; set; }
    public float QualityBonus { get; set; }
    public float QualityRate { get; set; }
    public float RdvBonus { get; set; }
    public int RdvCount { get; set; }
    public int RefusCount { get; set; }
    public float TotalSalary { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}