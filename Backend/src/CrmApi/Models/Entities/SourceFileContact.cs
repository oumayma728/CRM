using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("source_file_contacts")]
    public class SourceFileContact
    {
        [Key]
        public int Id { get; set; }
        public int SourceFileId { get; set; }
        [MaxLength(50)]
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsValid { get; set; } = true;
        [MaxLength(100)]
        public string? OriginalPhoneNumber { get; set; }
        [MaxLength(500)]
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("last_name")][MaxLength(100)] public string LastName { get; set; } = string.Empty;
        [Column("first_name")][MaxLength(100)] public string FirstName { get; set; } = string.Empty;
        [Column("address")][MaxLength(255)] public string Address { get; set; } = string.Empty;
        [Column("postal_code")][MaxLength(20)] public string PostalCode { get; set; } = string.Empty;
        [Column("city")][MaxLength(100)] public string City { get; set; } = string.Empty;
        [Column("email")][MaxLength(150)] public string? Email { get; set; }
        [NotMapped]
        public int RowNumber { get; set; }
        // Navigation property
        [ForeignKey("SourceFileId")]
        public virtual SourceFile? SourceFile { get; set; }
    }
}