using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("campaign_files")]
    public class CampaignFile
    {
        [Key]
        public int Id { get; set; }
        public int CampaignId { get; set; }
        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
        public int SourceFileId { get; set; }
        [ForeignKey("SourceFileId")]
        public SourceFile? SourceFile { get; set; }

        // Basic Status
        [Column("status")]
        public bool IsActive { get; set; } = true;
        public bool IsRecycled { get; set; } = false;
        public bool IsRemoved { get; set; } = false;
        public DateTime? RemovedAt { get; set; }
        public DateTime? RecycledAt { get; set; }

        // Injection Info
        public bool IsInjected { get; set; } = false;
        public DateTime? InjectedAt { get; set; }
        public int? InjectedByUserId { get; set; }

        // Contact Counters
        public int ContactsTotal { get; set; }
        public int ContactsCalled { get; set; }
        public int ContactsRemaining { get; set; }

        // ====================  SCHEDULING ====================
        public bool IsScheduled { get; set; } = false;
        public DateTime? ScheduledAt { get; set; }
        public int? ScheduledByUserId { get; set; }
        public string ScheduleStatus { get; set; } = "none"; // none, pending, executed, cancelled
        public int Priority { get; set; } = 0; 
    }
}