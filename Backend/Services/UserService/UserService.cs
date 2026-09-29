using Backend.Data;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.UserService
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _db;
        public UserService(ApplicationDbContext db) { _db = db; }
        
        public async Task<AppUser?> GetByIdAsync(int id) =>
            await _db.AppUsers.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        
        public async Task<List<AppUser>> GetAllAsync() =>
            await _db.AppUsers.Include(u => u.Role).Where(u => !u.IsDeleted).ToListAsync();
            
        public async Task<AppUser?> GetByEmailAsync(string email) =>
            await _db.AppUsers.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
    }
}
