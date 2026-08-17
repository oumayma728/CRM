using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("contact_notes")]
    public class ContactNote
    {
        [Key]
        public int Id { get; set; }
        public int CampaignId { get; set; }

        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
        public int CampaignFileContactId { get; set; }

        [ForeignKey("CampaignFileContactId")]
        public CampaignFileContact? CampaignFileContact { get; set; }
        public int? SourceFileContactId { get; set; }

        [ForeignKey("SourceFileContactId")]
        public SourceFileContact? SourceFileContact { get; set; }
        public int AuthorUserId { get; set; }

        [ForeignKey("AuthorUserId")]
        public User? Author { get; set; }
        [MaxLength(50)]
        public string NoteType { get; set; } = "General";
        [MaxLength(4000)]
        public string Body { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? UpdatedByUserId { get; set; }

        [ForeignKey("UpdatedByUserId")]
        public User? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public int? DeletedByUserId { get; set; }

        [ForeignKey("DeletedByUserId")]
        public User? DeletedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}