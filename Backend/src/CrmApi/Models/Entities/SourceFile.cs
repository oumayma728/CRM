using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    public enum SourceFileType
    {
        Original = 0,
        Processed = 1,
        Recycled = 2
    }

    [Table("source_files")]
    public class SourceFile
    {
        [Key]
        public int Id { get; set; }
        public int SupplierId { get; set; }

        [ForeignKey("SupplierId")]
        public Supplier? Supplier { get; set; }
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(255)]
        public string OriginalName { get; set; } = string.Empty;
        [MaxLength(50)]
        public string FileSizeLabel { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string FilePath { get; set; } = string.Empty;
        [MaxLength(10)]
        public string Format { get; set; } = string.Empty;
        public SourceFileType Type { get; set; } = SourceFileType.Original;
        [MaxLength(20)]
        public string Statut { get; set; } = "original";
        public bool IsActive { get; set; } = false;
        public int TotalLines { get; set; }
        public int ValidContacts { get; set; }
        public int Duplicates { get; set; }
        public int EmptyRows { get; set; }
        public int InvalidPhones { get; set; }
        public int ContactCount { get; set; }
        public int ListNumber { get; set; }
        public DateTime UploadedAt { get; set; }
        [MaxLength(64)]
        public string? FileHash { get; set; }
        public DateTime? ValidatedAt { get; set; }
        public DateTime? ParsedAt { get; set; }
        public int UploadedByUserId { get; set; }

        [ForeignKey("UploadedByUserId")]
        public User? UploadedByUser { get; set; }
        public int? ParentSourceFileId { get; set; }

        [ForeignKey("ParentSourceFileId")]
        public SourceFile? ParentSourceFile { get; set; }
        public int? SplitPartNumber { get; set; }
        public int? SplitTotalParts { get; set; }

        [InverseProperty("ParentSourceFile")]
        public List<SourceFile>? ChildFiles { get; set; }
        public int? RecycledFromCampaignListId { get; set; }
        public bool IsSplitParent { get; set; } = false;
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public int? DeletedByUserId { get; set; }

    }
}