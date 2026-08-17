using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities  // or CrmApi.Models.Entities - wherever this belongs
{
    [Table("contacts")]
    public class DistributedContact
    {
        [Key]
        public int Id { get; set; }

        // where it came from
        public int SourceFileContactId { get; set; }
        public int? AgentId { get; set; }  // assigned agent

        // contact info (copied from source_file_contact on inject)
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;
        [MaxLength(50)]
        public string Phone { get; set; } = string.Empty;
        [MaxLength(150)]
        public string? Email { get; set; }
        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;
        [MaxLength(20)]
        public string PostalCode { get; set; } = string.Empty;
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        // CRM fields (qualification)
        [MaxLength(50)]
        public string? Status { get; set; }
        [MaxLength(1000)]
        public string? Comment { get; set; }
        [MaxLength(50)]
        public string? Gsm { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // navigation
        [ForeignKey(nameof(SourceFileContactId))]
        public virtual SourceFileContact? SourceFileContact { get; set; }

        [ForeignKey(nameof(AgentId))]
        public virtual User? Agent { get; set; }
    }
}