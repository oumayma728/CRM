using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("source_file_invalid_rows")]
    public class SourceFileInvalidRow
    {
        [Key]
        public int Id { get; set; }
        public int ImportJobId { get; set; }

        [ForeignKey("ImportJobId")]
        public ImportJob? ImportJob { get; set; }
        public int? SourceFileId { get; set; }

        [ForeignKey("SourceFileId")]
        public SourceFile? SourceFile { get; set; }
        public int RowNumber { get; set; }
        [MaxLength(100)]
        public string? Phone { get; set; }
        [MaxLength(255)]
        public string? Name { get; set; }
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}