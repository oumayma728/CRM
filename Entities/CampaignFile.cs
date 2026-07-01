using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Entities;
namespace Backend.Entities
{
    [Table("campaign_files")]
    public class CampaignFile
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("campaign_id")]
        public int CampaignId { get; set; }

        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }

        [Column("source_file_id")]
        public int SourceFileId { get; set; }

        [ForeignKey("SourceFileId")]
        public SourceFile? SourceFile { get; set; }

        [Column("status")]
        public bool IsActive { get; set; } = true;

        [Column("is_recycled")]
        public bool IsRecycled { get; set; } = false;
        [Column("is_removed")]
        public bool IsRemoved { get; set; } = false;

        [Column("removed_at")]
        public DateTime RemovedAt { get; set; } = DateTime.UtcNow;

        [Column("recycled_at")]
        public DateTime? RecycledAt { get; set; }

        [Column("injected_at")]
        public DateTime? InjectedAt { get; set; } = DateTime.UtcNow;
        [Column("is_injected")]
        public bool IsInjected { get; set; } = false;

        [Column("contacts_total")]
        public int ContactsTotal { get; set; }

        [Column("contacts_called")]
        public int ContactsCalled { get; set; }

        [Column("contacts_remaining")]
        public int ContactsRemaining { get; set; }

        // Distribution settings per injection
        [Column("distribution_mode")]
        public string DistributionMode { get; set; } = "Hybrid";

        [Column("performance_weight")]
        public int PerformanceWeight { get; set; } = 70;

        [Column("random_weight")]
        public int RandomWeight { get; set; } = 30;

        [Column("quota_per_agent")]
        public int? QuotaPerAgent { get; set; }

        [Column("auto_redistribute")]
        public bool AutoRedistribute { get; set; } = true;

        [Column("injected_by_user_id")]
        public int? InjectedByUserId { get; set; }
        [Column("copied_file_path")]
        public string? CopiedFilePath { get; set; }
        // Scheduling
        [Column("is_scheduled")]
        public bool IsScheduled { get; set; } = false;

        [Column("scheduled_at")]
        public DateTime? ScheduledAt { get; set; }

        [Column("scheduled_by_user_id")]
        public int? ScheduledByUserId { get; set; }

        [Column("schedule_status")]
        public string ScheduleStatus { get; set; } = "none"; // none / pending / executed / cancelled
    }
}