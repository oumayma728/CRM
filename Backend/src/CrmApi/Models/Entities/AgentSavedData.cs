using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("agent_saved_data")]
public class AgentSavedData
{
    [Key]
    public int Id { get; set; }
    public int AgentId { get; set; }

    [ForeignKey("AgentId")]
    public User? Agent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(50)]
    public string DataType { get; set; } = "session";
    public string? Payload { get; set; } // JSONB
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}