using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

public class Followup
{
    [Key]
    public long Id { get; set; }

    public long? ContactId { get; set; }

    [ForeignKey(nameof(ContactId))]
    public virtual Contact? Contact { get; set; }

    public int? AgentId { get; set; }

    [ForeignKey(nameof(AgentId))]
    public virtual User? Agent { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "a_relancer";

    public string? AgentName { get; set; }

    public DateTime AppointmentDate { get; set; }
    public int RelanceCount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}