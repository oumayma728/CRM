using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

/// <summary>Pointage avancé avec suivi des pauses (module Khaled)</summary>
public class AdvancedAttendance
{
    [Key]
    public int Id { get; set; }

    public long UserId { get; set; }

    public DateTime Date { get; set; }
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }

    /// <summary>active | paused | completed</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public virtual Utilisateur? User { get; set; }
}