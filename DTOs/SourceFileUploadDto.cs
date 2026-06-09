using Backend.Entities;
using Microsoft.AspNetCore.Http;

namespace Backend.DTOs
{
    public class SourceFileUploadDto
    {
        public int? SupplierId { get; set; }
        public string? Name { get; set; }
        public IFormFile File { get; set; } = null!;
        public string? NewSupplierName { get; set; }
        public int CountryId { get; set; }
        public int LeadTypeId { get; set; }
        public int UserId { get; set; }
    }
    public class SourceFileResponseDto
    {
        public int Id { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public int CountryId { get; set; }
        public string CountryName { get; set; } = string.Empty;
        public string CountryCode { get; set; } = string.Empty;
        public int LeadTypeId { get; set; }
        public string LeadTypeName { get; set; } = string.Empty;
        public string LeadTypeCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string OriginalName { get; set; } = string.Empty;
        public string FileSizeLabel { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string Format { get; set; } = string.Empty;
        public string Statut { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public bool IsActive { get; set; }
        public int ListNumber { get; set; }
        public int ContactCount { get; set; }
    }
    public class UploadResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public SourceFileResponseDto? File { get; set; }
    }
    public class RenameFileDto
    {
        public string NewName { get; set; } = string.Empty;
    }
    public class DeleteResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int Id { get; set; }
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
    }
}
