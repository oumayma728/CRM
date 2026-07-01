using Backend.DTOs;
using Backend.Models;
using Backend.Data;
using Backend.Services.Suppliers;
using Backend.Services.Files;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using Backend.Entities;
namespace Backend.Services.SourceFiles
{
    public class SourceFileService : ISourceFileService
    {
        private readonly ApplicationDbContext _db;
        private readonly ISupplierService _supplierService;
        private readonly IFileStorageService _fileStorageService;

        public SourceFileService(ApplicationDbContext db,
            ISupplierService supplierService,
            IFileStorageService fileStorageService
            )
        {
            _db = db;
            _supplierService = supplierService;
            _fileStorageService = fileStorageService;
        }

        //upload file
        public async Task<SourceFileResponseDto> UploadFileAsync(SourceFileUploadDto uploadDto, int userId)
        {
            var supplier = await _supplierService.GetOrCreateSupplierAsync(uploadDto);
            int contactCount = await CountContactsInFileAsync(uploadDto.File);

            //save file
            var filePath = await _fileStorageService.SaveFileAsync(uploadDto.File, supplier.Id);
            //get next list number for this supplier
            var nextListNumber = await GetNextListNumberAsync(supplier.Id);
            //Generate display name
            var displaName = GenerateDisplayName(supplier.Name, nextListNumber);

            //create database record
            var sourceFile = new SourceFile
            {
                SupplierId = supplier.Id,
                Name = displaName,
                OriginalName = uploadDto.File.FileName,
                FilePath = filePath,
                FileSizeBytes = uploadDto.File.Length,
                FileSizeLabel = FormatFileSize(uploadDto.File.Length),
                Format = Path.GetExtension(uploadDto.File.FileName).TrimStart('.'),
                Statut = "original",
                ListNumber = nextListNumber,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserId = userId,
                IsActive = false,
                TotalLines = contactCount,
                ContactCount = contactCount,
            };

            _db.SourceFiles.Add(sourceFile);
            await _db.SaveChangesAsync();

            return MapToDto(sourceFile, supplier);
        }

        //Get all files for a supplier
        public async Task<List<SourceFileResponseDto>> GetFilesBySupplierAsync(int supplierId)
        {
            var files = await _db.SourceFiles
                .Where(f => f.SupplierId == supplierId)
                .Include(f => f.Supplier)
                .OrderByDescending(f => f.UploadedAt)
                .ToListAsync();
            return files.Select(f => MapToDto(f, f.Supplier)).ToList();
        }

        //get all files
        public async Task<List<SourceFileResponseDto>> GetAllFilesAsync()
        {
            var files = await _db.SourceFiles
                .Include(f => f.Supplier)
                .OrderByDescending(f => f.UploadedAt)
                .ToListAsync();
            return files.Select(f => MapToDto(f, f.Supplier)).ToList();
        }

        //get single file by id
        public async Task<SourceFileResponseDto> GetFileByIdAsync(int Id)
        {
            var file = await _db.SourceFiles
                .Include(f => f.Supplier)
                .FirstOrDefaultAsync(f => f.Id == Id);
            if (file == null)
            {
                throw new Exception("File not found");
            }
            return MapToDto(file, file.Supplier);
        }

        public async Task<bool> DeleteFileAsync(int Id)
        {
            var file = await _db.SourceFiles.FindAsync(Id);
            if (file == null)
            {
                return false;
            }
            //delete file from disk
            if (File.Exists(file.FilePath))
            {
                File.Delete(file.FilePath);
            }
            //delete record from database
            _db.SourceFiles.Remove(file);
            await _db.SaveChangesAsync();
            return true;  
        }

        public async Task<SourceFileResponseDto> RenameFileAsync(int Id, string newName)
        {
            //find the file with supplier
            var file = await _db.SourceFiles
                .Include(f => f.Supplier)
                .FirstOrDefaultAsync(f => f.Id == Id);
            if (file == null)
            {
                throw new Exception("File not found");
            }
            //validate new name
            if (string.IsNullOrWhiteSpace(newName))
            {
                throw new Exception("New name cannot be empty");
            }
            if (newName.Length > 255)
            {
                throw new Exception("New name is too long");
            }

            file.Name = newName;
            await _db.SaveChangesAsync();
            return MapToDto(file, file.Supplier);  
        }

        public async Task<byte[]> DownloadFileAsync(int id)
        {
            var file = await _db.SourceFiles.FindAsync(id);
            if (file == null)
            {
                throw new Exception("File not found");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(file.FilePath);
            return fileBytes;
        }

        public async Task<int> CountContactsInFileAsync(IFormFile file)
        {
            var tempFilePath = Path.GetTempFileName();

            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var extension = Path.GetExtension(file.FileName).ToLower();

                if (extension == ".csv")
                {
                    return await CountCsvRowsAsync(tempFilePath);
                }
                else if (extension == ".xlsx" || extension == ".xls")
                {
                    return await CountExcelRowsAsync(tempFilePath);
                }
                return 0;
            }
            finally
            {
                if (File.Exists(tempFilePath))
                    File.Delete(tempFilePath);
            }
        }

        private async Task<int> CountExcelRowsAsync(string filePath)
        {
            // ✅ Add license context
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage(new FileInfo(filePath)))
            {
                var worksheet = package.Workbook.Worksheets[0];
                var dimension = worksheet.Dimension;
                if (dimension == null) return 0;
                return dimension.Rows - 1; // Subtract header
            }
        }

        private async Task<int> CountCsvRowsAsync(string filePath)
        {
            int contactCount = 0;
            bool isFirstLine = true;

            using (var reader = new StreamReader(filePath))
            {
                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    if (isFirstLine)
                    {
                        isFirstLine = false;
                        continue;
                    }
                    contactCount++;
                }
            }
            return contactCount;
        }

        //helper : Generate display name from supplier name
        private string GenerateDisplayName(string supplierName, int listNumber)
        {
            return $"{supplierName}_List{listNumber}";
        }

        //helper : Get next list number for a supplier
        private async Task<int> GetNextListNumberAsync(int supplierId)
        {
            var maxNumber = await _db.SourceFiles
                .Where(f => f.SupplierId == supplierId)
                .MaxAsync(f => (int?)f.ListNumber) ?? 0;
            return maxNumber + 1;
        }

        // Helper: Format file size (bytes → KB/MB)
        private string FormatFileSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024} KB";
            return $"{bytes / (1024.0 * 1024):F1} MB";
        }

        // ✅ Add the MapToDto method
        private SourceFileResponseDto MapToDto(SourceFile file, Supplier supplier)
        {
            return new SourceFileResponseDto
            {
                Id = file.Id,
                SupplierId = file.SupplierId,
                SupplierName = supplier?.Name ?? "",
                CountryId = supplier?.CountryId ?? 0,
                CountryName = supplier?.Country?.Name ?? "",
                CountryCode = supplier?.Country?.Code ?? "",

                LeadTypeId = supplier?.LeadTypeId ?? 0,
                LeadTypeCode = supplier?.LeadType?.Code ?? "",
                LeadTypeName = supplier?.LeadType?.Name ?? "",

                Name = file.Name,
                OriginalName = file.OriginalName,
                FileSizeLabel = file.FileSizeLabel,
                FileSizeBytes = file.FileSizeBytes,
                Format = file.Format,
                Statut = file.Statut,
                IsActive = file.IsActive,
                UploadedAt = file.UploadedAt,
                ListNumber = file.ListNumber,
                ContactCount = file.ContactCount
            };
        }
    }
}