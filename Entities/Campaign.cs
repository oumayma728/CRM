using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Entities;
namespace Backend.Entities
{
    public enum CampaignStatus
    {
        Active = 0,
        Paused = 1,
        Stopped = 2,
        Inactive = 3  
    }

    [Table("campaigns")]
    public class Campaign
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        [Column("description")]
        [MaxLength(255)]
        public string? Description { get; set; }

        [Column("status")]
        public CampaignStatus Status { get; set; } = CampaignStatus.Active;

        [Column("start_date")]
        public DateTime? StartDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by_user_id")]
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User? CreatedByUser { get; set; }

        // Soft delete
        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("deleted_at")]
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public List<CampaignFile> CampaignFiles { get; set; } = new();
        public List<CampaignAgents> CampaignAgents { get; set; } = new();
    }
}