using Backend.DTOs;
using Backend.Services.SourceFiles;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/SourceFiles")]
    public class SourceFileController : ControllerBase
    {
        private readonly ISourceFileService _service;
        public SourceFileController(ISourceFileService service)
        {
            _service = service;
        }
        // POST: api/SourceFiles/upload
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] SourceFileUploadDto uploadDto)
        {
            Console.WriteLine("=== UPLOAD REQUEST RECEIVED ===");
            Console.WriteLine($"SupplierId: {uploadDto.SupplierId}");
            Console.WriteLine($"Country: '{uploadDto.CountryId}'");
            Console.WriteLine($"LeadType: '{uploadDto.LeadTypeId}'");
            Console.WriteLine($"UserId: {uploadDto.UserId}");
            Console.WriteLine($"FileName: {uploadDto.File?.FileName}");
            Console.WriteLine($"FileLength: {uploadDto.File?.Length}");
            Console.WriteLine($"Name: {uploadDto.Name}");
            Console.WriteLine($"NewSupplierName: {uploadDto.NewSupplierName}");
            try
            {
                //validate file exists
                if (uploadDto.File == null || uploadDto.File.Length == 0)
                {
                    return BadRequest("No file uploaded.");
                }
                //validate file type
                var allowedExtensions = new[] { ".csv", ".xlsx" , ".xls" };
                var extension = Path.GetExtension(uploadDto.File.FileName).ToLower();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest("Invalid file type. Only CSV and Excel files are allowed.");
                }
                //get current user id
                //var userId = GetCurrentUserId();
                //upload file
                var result = await _service.UploadFileAsync(uploadDto, uploadDto.UserId);

                return Ok(new
                {
                    success = true,
                    message = "File uploaded successfully.",
                    file = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while uploading the file.",
                    error = ex.Message
                });
            }
        }
        // Backend/Controllers/SourceFileController.cs

        [HttpPost("count-contacts")]
        public async Task<IActionResult> CountContacts([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                var contactCount = await _service.CountContactsInFileAsync(file);

                return Ok(new { contactCount = contactCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFiles()
        {
            try
            {
                var files = await _service.GetAllFilesAsync();
                return Ok(new
                {
                    success = true,
                    files = files
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the files.",
                    error = ex.Message
                });
            }
        }

        // GET: api/SourceFiles/supplier/5
        [HttpGet("supplier/{supplierId}")]
        public async Task<IActionResult> GetSupplierFiles(int supplierId)
        {
            try
            {
                var files = await _service.GetFilesBySupplierAsync(supplierId);
                return Ok(new
                {
                    success = true,
                    files = files
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the files.",
                    error = ex.Message
                });
            }
        }
        //Get file by id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFile(int Id)
        {
            try
            {
                var file = await _service.GetFileByIdAsync(Id);
                return Ok(file);
            }
            catch (Exception)
            {
                return NotFound(new { error = "File not found" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFile(int Id)
        {
            try
            {
                await _service.DeleteFileAsync(Id);
                return Ok(new
                {
                    success = true,
                    message = "File deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting the file.",
                    error = ex.Message
                });
            }
        }

        [HttpPut("{id}/rename")]
        public async Task<IActionResult> Rename (int Id , [FromBody] RenameFileDto renameDto)
        {
            try
            {
                var file = await _service.RenameFileAsync(Id, renameDto.NewName);
                return Ok(new
                {
                    success = true,
                    message = "File renamed successfully.",
                    file = file
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while renaming the file.",
                    error = ex.Message
                });
            }
        }

        
    }
}
