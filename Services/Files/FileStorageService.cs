using Backend.DTOs;
using Backend.Models;
using Backend.Services.Files;
namespace Backend.Services.Files
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }
        public async Task<string> SaveFileAsync(IFormFile file , int supplierId)
        {
            var folder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", $"supplier_{supplierId}"); 

            // CREATE folder if it doesn't exist
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            var uniqueFileName = $"{DateTime.Now:yyyyMMdd_HHmmss}_{file.FileName}";
            var filePath = Path.Combine(folder, uniqueFileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }
            return filePath;
        }
        public async Task DeleteFileAsync(string path)
        {
            if (File.Exists(path))
                File.Delete(path);

            await Task.CompletedTask;
        }

    }
}