using Backend.DTOs;
namespace Backend.Services.SourceFiles
{
    public interface ISourceFileService
    {
        // Upload a file
        Task<SourceFileResponseDto> UploadFileAsync(SourceFileUploadDto uploadDto, int userId);

        // Get all files for a supplier
        Task<List<SourceFileResponseDto>> GetFilesBySupplierAsync(int supplierId);

        //Get all files 
        Task<List<SourceFileResponseDto>> GetAllFilesAsync();


        // Get single file by ID
        Task<SourceFileResponseDto> GetFileByIdAsync(int Id);

        // Delete a file
        Task<bool> DeleteFileAsync(int Id);

        // Download file (returns byte array)
        Task<byte[]> DownloadFileAsync(int Id);

        //Rename file
        Task<SourceFileResponseDto> RenameFileAsync(int Id, string newName);
        //count contacts in file
        Task<int> CountContactsInFileAsync(IFormFile file);
    }
}
