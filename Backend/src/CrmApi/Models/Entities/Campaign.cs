using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    public enum CampaignStatus
    {
        Draft = 0,  // created, not yet activated
        Active = 1,  // agents calling
        Inactive = 2   // paused/stopped, resumable
    }

    [Table("campaigns")]
    public class Campaign
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        [MaxLength(255)]
        public string? Description { get; set; }
        public CampaignStatus Status { get; set; } = CampaignStatus.Active;
        public DateTime? StartDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User? CreatedByUser { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public int? DeletedByUserId { get; set; }
        public bool AutoPoolSizing { get; set; } = true;
        public int ActivePoolTarget { get; set; } = 75000;
        public int LowContactsThreshold { get; set; } = 20000;
        public int ContactsPerAgentPerHour { get; set; } = 25;
        public int PoolBufferHours { get; set; } = 7;
        public int MaxPoolTarget { get; set; } = 75000;
        public int MinPoolTarget { get; set; } = 5000;
        public decimal LowPoolRatio { get; set; } = 0.30m;



        // Navigation properties
        public List<CampaignFile> CampaignFiles { get; set; } = new();
        public List<CampaignAgents> CampaignAgents { get; set; } = new();
    }
}