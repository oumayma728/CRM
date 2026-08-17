using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("campaign_agents")]
    public class CampaignAgents
    {
        [Key]
        public int Id { get; set; }
        public int CampaignId { get; set; }

        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public int AssignedByUserId { get; set; }
        public bool IsActive { get; set; } = true;

        // Optional: Track quota per agent in this campaign
        public int? Quota { get; set; }

        // Optional: Track weight for distribution
        public int? Weight { get; set; }
    }
}