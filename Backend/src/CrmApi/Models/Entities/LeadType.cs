using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("lead_types")]
    public class LeadType
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty;
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int CountryId { get; set; }

        // Navigation properties
        [ForeignKey("CountryId")]
        public Country Country { get; set; } = null!;
        public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    }
}