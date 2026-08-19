using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    public enum ImportJobStatus
    {
        Queued = 0,
        Processing = 1,
        Completed = 2,
        Failed = 3
    }

    [Table("import_jobs")]
    public class ImportJob
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(20)]
        public ImportJobStatus Status { get; set; } = ImportJobStatus.Queued;
        public int? SourceFileId { get; set; }

        [ForeignKey("SourceFileId")]
        public SourceFile? SourceFile { get; set; }
        public int SupplierId { get; set; }

        [ForeignKey("SupplierId")]
        public Supplier? Supplier { get; set; }
        public int CountryId { get; set; }

        [ForeignKey("CountryId")]
        public Country? Country { get; set; }
        public int LeadTypeId { get; set; }

        [ForeignKey("LeadTypeId")]
        public LeadType? LeadType { get; set; }
        public int UploadedByUserId { get; set; }

        [ForeignKey("UploadedByUserId")]
        public User? UploadedByUser { get; set; }
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;
        [MaxLength(255)]
        public string? DisplayName { get; set; }
        public string StoredFilePath { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        [MaxLength(64)]
        public string FileHash { get; set; } = string.Empty;
        [MaxLength(10)]
        public string Format { get; set; } = string.Empty;
        public string? ColumnMappingJson { get; set; }
        public int TotalRows { get; set; }
        public int ProcessedRows { get; set; }
        public DateTime? LastHeartbeatAt { get; set; }
        [MaxLength(100)]
        public string? WorkerId { get; set; }
        public int Attempts { get; set; }
        public int MaxAttempts { get; set; } = 3;
        public DateTime? RawFileDeletedAt { get; set; }
        public int ValidContacts { get; set; }
        public int EmptyRows { get; set; }
        public int InvalidPhones { get; set; }
        public int Duplicates { get; set; }
        [MaxLength(2000)]
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}