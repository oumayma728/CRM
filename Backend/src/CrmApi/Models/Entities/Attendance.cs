using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("attendance")]
public class Attendance
{
    [Key]
    public long Id { get; set; }
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime Date { get; set; }
    [MaxLength(20)]
    public string Status { get; set; } = "active";
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    public ICollection<AttendanceBreak> Breaks { get; set; } = new List<AttendanceBreak>();
}