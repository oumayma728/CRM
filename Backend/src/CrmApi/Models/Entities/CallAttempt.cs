using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("call_attempts")]
    public class CallAttempt
    {
        [Key]
        public int Id { get; set; }
        public int CampaignId { get; set; }

        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
        public int CampaignFileId { get; set; }

        [ForeignKey("CampaignFileId")]
        public CampaignFile? CampaignFile { get; set; }
        public int CampaignFileContactId { get; set; }

        [ForeignKey("CampaignFileContactId")]
        public CampaignFileContact? CampaignFileContact { get; set; }
        public int SourceFileContactId { get; set; }

        [ForeignKey("SourceFileContactId")]
        public SourceFileContact? SourceFileContact { get; set; }
        public int AgentId { get; set; }

        [ForeignKey("AgentId")]
        public User? Agent { get; set; }
        public int AttemptNumber { get; set; }
        [MaxLength(50)]
        public string Status { get; set; } = "Assigned";
        [MaxLength(50)]
        public string? QualificationStatus { get; set; }
        [MaxLength(50)]
        public string? Provider { get; set; }
        [MaxLength(100)]
        public string? ProviderCallId { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AnsweredAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int? DurationSeconds { get; set; }
        [MaxLength(500)]
        public string? RecordingUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}