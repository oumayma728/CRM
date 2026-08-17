using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("suppliers")]
    public class Supplier
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public int CountryId { get; set; }

        [ForeignKey("CountryId")]
        public Country? Country { get; set; }
        public int LeadTypeId { get; set; }

        [ForeignKey("LeadTypeId")]
        public LeadType? LeadType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int CreatedByUserId { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User? CreatedByUser { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public int? DeletedByUserId { get; set; }

        public ICollection<SourceFile> SourceFiles { get; set; } = new List<SourceFile>();
    }
}