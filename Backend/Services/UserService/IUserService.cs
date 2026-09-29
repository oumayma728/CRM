using Backend.Entities;

namespace Backend.Services.UserService
{
    public interface IUserService
    {
        Task<AppUser?> GetByIdAsync(int id);
        Task<List<AppUser>> GetAllAsync();
        Task<AppUser?> GetByEmailAsync(string email);
    }
}
