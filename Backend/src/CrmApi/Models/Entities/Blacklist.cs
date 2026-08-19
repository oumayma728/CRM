using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("blacklist")]
    public class Blacklist
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(50)]
        public string PhoneNumber { get; set; } = "";
        public int AddedByUserId { get; set; }

        [ForeignKey("AddedByUserId")]
        public User? AddedByUser { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        [MaxLength(255)]
        public string? Reason { get; set; }
        public int? CampaignId { get; set; }

        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
    }
}