using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace CrmApi.Models.Entities
{
    [Table("countries")]
    public class Country
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(5)]
        public string Code { get; set; } = string.Empty;
        [MaxLength(5)]
        public string PhonePrefix { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
        public ICollection<LeadType> LeadTypes { get; set; } = new List<LeadType>();
    }
}