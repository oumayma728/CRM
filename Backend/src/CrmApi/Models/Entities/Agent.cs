using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("agents")]
public class Agent
{
    [Key]
    public int Id { get; set; }
    [MaxLength(50)]
    public string AgentId { get; set; } = string.Empty;
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(120)]
    public string? Email { get; set; }
    public int TotalCalls { get; set; }
    public DateTime? FirstCall { get; set; }
    public DateTime? LastCall { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}