using CrmApi.Data;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Auth;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _db;

    public PermissionService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<bool> UserHasPermissionAsync(int userId, string permission)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;

        var role = user.Role.ToString().ToLower();
        return await _db.RolePermissions
            .AnyAsync(rp => rp.Role == role && rp.Permission.Name == permission);
    }

    public async Task<List<string>> GetUserPermissionsAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return new List<string>();

        var role = user.Role.ToString().ToLower();
        return await _db.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => rp.Role == role)
            .Select(rp => rp.Permission.Name)
            .ToListAsync();
    }

    public async Task<List<string>> GetUserPermissionsAsync(string role)
    {
        return await _db.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => rp.Role == role.ToLower())
            .Select(rp => rp.Permission.Name)
            .ToListAsync();
    }

    public async Task<List<RolePermissionDto>> GetAllRolePermissionsAsync()
    {
        var rolePermissions = await _db.RolePermissions
            .Include(rp => rp.Permission)
            .ToListAsync();

        return rolePermissions.Select(rp => new RolePermissionDto
        {
            Role = rp.Role,
            Permission = rp.Permission.Name,
            Granted = true
        }).ToList();
    }

    public async Task SetRolePermissionAsync(string role, string permission, bool granted)
    {
        var perm = await _db.Permissions.FirstOrDefaultAsync(p => p.Name == permission);
        if (perm == null) return;

        var existing = await _db.RolePermissions
            .FirstOrDefaultAsync(rp => rp.Role == role.ToLower() && rp.PermissionId == perm.Id);

        if (granted && existing == null)
        {
            _db.RolePermissions.Add(new RolePermission
            {
                Role = role.ToLower(),
                PermissionId = perm.Id
            });
        }
        else if (!granted && existing != null)
        {
            _db.RolePermissions.Remove(existing);
        }

        await _db.SaveChangesAsync();
    }
}
