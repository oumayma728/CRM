using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("logs")]
public class Log
{
    [Key]
    public int Id { get; set; }
    [MaxLength(100)]
    public string? Action { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    [MaxLength(50)]
    public string? UserId { get; set; }
}