// Services/PermissionService.cs
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;
using Backend.Constants;
using Backend.DTOs.Permissions;
using System.Security.Claims;
using PermissionEntity = Backend.Entities.Permission;

namespace Backend.Services.Permission
{
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _http;

        public PermissionService(ApplicationDbContext context, IHttpContextAccessor http)
        {
            _context = context;
            _http = http;
        }

        // ─── Sync check (JWT claims) ──────────────────────────────────────────
        public bool HasPermission(string permission)
        {
            if (_http.HttpContext?.User == null) return false;
            if (_http.HttpContext.User.IsInRole(Roles.SuperAdmin)) return true;
            return _http.HttpContext.User
                .FindAll("permission")
                .Any(c => c.Value == permission);
        }

        // ─── DB-based async check ─────────────────────────────────────────────
        public async Task<bool> HasPermissionAsync(int userId, string permission)
        {
            var user = await _context.Set<Utilisateur>()
                .FirstOrDefaultAsync(u => u.Id == userId && u.Actif);

            if (user == null) return false;

            string role = user.Role;
            if (user is Confirmatrice confirmatrice)
            {
                role = confirmatrice.Type switch {
                    TypeConfirmatrice.CONF1 => "CONF1",
                    TypeConfirmatrice.CONF2 => "CONF2",
                    TypeConfirmatrice.CONFCLIENT => "CONFCLIENT",
                    _ => role
                };
            }

            if (role == Roles.SuperAdmin) return true;

            if (Permissions.RolePermissions.ContainsKey(role))
                return Permissions.RolePermissions[role].Contains(permission);

            return false;
        }

        public async Task<bool> HasPermissionForUserScopeAsync(int userId, string permission, int scopeUserId)
        {
            if (userId == scopeUserId) return true;
            return await HasPermissionAsync(userId, permission);
        }

        public async Task<List<string>> GetUserPermissionsAsync(int userId)
        {
            var user = await _context.Set<Utilisateur>()
                .FirstOrDefaultAsync(u => u.Id == userId && u.Actif);

            if (user == null) return new List<string>();

            string role = user.Role;
            if (user is Confirmatrice confirmatrice)
            {
                role = confirmatrice.Type switch {
                    TypeConfirmatrice.CONF1 => "CONF1",
                    TypeConfirmatrice.CONF2 => "CONF2",
                    TypeConfirmatrice.CONFCLIENT => "CONFCLIENT",
                    _ => role
                };
            }

            if (Permissions.RolePermissions.ContainsKey(role))
                return Permissions.RolePermissions[role].ToList();

            return new List<string>();
        }

        public Task InitializePermissionsAsync() => Task.CompletedTask;

        // ─── Admin methods ────────────────────────────────────────────────────
        public async Task<List<PermissionDto>> GetAllPermissionsAsync()
        {
            return await _context.Permissions
                .OrderBy(p => p.GroupName)
                .ThenBy(p => p.Name)
                .Select(p => new PermissionDto { Id = p.Id, Name = p.Name, GroupName = p.GroupName })
                .ToListAsync();
        }

        public async Task<List<RolePermissionDto>> GetRolesWithPermissionsAsync()
        {
            return await _context.Roles
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .Select(r => new RolePermissionDto
                {
                    RoleId = r.Id,
                    RoleName = r.Name,
                    PermissionNames = r.RolePermissions
                        .Select(rp => rp.Permission.Name)
                        .OrderBy(n => n)
                        .ToList()
                })
                .ToListAsync();
        }

        public async Task UpdateRolePermissionsAsync(int roleId, List<string> permissionNames)
        {
            var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId && r.IsActive);

            if (role == null)
                throw new ArgumentException("Role not found");

            var permissions = await _context.Permissions
                .Where(p => permissionNames.Contains(p.Name))
                .ToListAsync();

            role.RolePermissions.Clear();
            foreach (var perm in permissions)
            {
                role.RolePermissions.Add(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = perm.Id
                });
            }
            await _context.SaveChangesAsync();
        }

        public async Task<List<UserPermissionDto>> GetUsersWithPermissionsAsync()
        {
            var users = await _context.Set<Utilisateur>()
                .Where(u => u.Actif)
                .Take(100)
                .ToListAsync();

            return users.Select(u => new UserPermissionDto
            {
                UserId = (int)u.Id,
                UserName = $"{u.Prenom} {u.Nom}".Trim(),
                Email = u.Email,
                RoleName = u.Role,
                PermissionNames = Permissions.RolePermissions.ContainsKey(u.Role)
                    ? Permissions.RolePermissions[u.Role].ToList()
                    : new List<string>(),
                ScopedPermissions = new List<UserPermissionScopeDto>()
            }).ToList();
        }

        public async Task<List<PermissionTargetUserDto>> GetPermissionTargetUsersAsync()
        {
            return await _context.Set<Utilisateur>()
                .Where(u => u.Actif)
                .Take(200)
                .Select(u => new PermissionTargetUserDto
                {
                    UserId = (int)u.Id,
                    UserName = u.Prenom + " " + u.Nom,
                    Email = u.Email,
                    RoleName = u.Role
                })
                .ToListAsync();
        }

        public async Task UpdateUserPermissionsAsync(int userId, UpdateUserPermissionsDto dto)
        {
            // For now, log and return - custom user permissions stored in user_permissions table
            var existing = _context.UserPermissions.Where(up => up.UserId == userId && up.ScopeType == null);
            _context.UserPermissions.RemoveRange(existing);

            foreach (var permName in dto.PermissionNames)
            {
                var perm = await _context.Permissions.FirstOrDefaultAsync(p => p.Name == permName);
                if (perm != null)
                {
                    _context.UserPermissions.Add(new UserPermission
                    {
                        UserId = userId,
                        PermissionId = perm.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
        }
    }
}
