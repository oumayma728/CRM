using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

/// <summary>Pause within an attendance session</summary>
public class AttendanceBreak
{
    [Key]
    public int Id { get; set; }

    /// <summary>FK to the parent Attendance record</summary>
    public long AttendanceId { get; set; }

    /// <summary>inter_appel | cafe | dejeuner | priere | technique | personnelle</summary>
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }

    /// <summary>Calculated duration in minutes when break is closed</summary>
    public int DurationMinutes { get; set; }

    // Navigation
    [ForeignKey(nameof(AttendanceId))]
    public virtual Attendance? Attendance { get; set; }
}