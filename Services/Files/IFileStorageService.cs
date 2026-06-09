namespace Backend.Services.Files
{
	public interface IFileStorageService
	{
		Task<string> SaveFileAsync(IFormFile file, int supplierId);
		Task DeleteFileAsync(string path);
	}
}
