using Backend.Constants;
using Backend.Data;
using Backend.DTOs.Permissions;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Permissions
{
    public class PermissionService : IPermissionService
    {
        private const string UserScopeType = "User";

        private readonly ApplicationDbContext _db;
        private readonly IHttpContextAccessor _http;

        public PermissionService(ApplicationDbContext db, IHttpContextAccessor http)
        {
            _db = db;
            _http = http;
        }

        public bool HasPermission(string permission)
        {
            if (_http.HttpContext?.User == null) return false;
            if (_http.HttpContext.User.IsInRole(Roles.SuperAdmin)) return true;

            return _http.HttpContext.User
                .FindAll("permission")
                .Any(c => c.Value == permission);
        }

        public async Task<bool> HasPermissionAsync(int userId, string permission)
        {
            var userRole = await _db.Users
                .Include(u => u.Role)
                .Where(u => u.Id == userId)
                .Select(u => new { u.RoleId, RoleName = u.Role.Name })
                .FirstOrDefaultAsync();

            if (userRole == null) return false;
            if (userRole.RoleName == Roles.SuperAdmin) return true;

            var hasRolePermission = await _db.RolePermissions
                .AnyAsync(rp => rp.RoleId == userRole.RoleId && rp.Permission.Name == permission);

            if (hasRolePermission) return true;

            return await _db.UserPermissions
                .AnyAsync(up =>
                    up.UserId == userId
                    && up.Permission.Name == permission
                    && up.ScopeType == null
                    && up.ScopeUserId == null);
        }

        public async Task<bool> HasPermissionForUserScopeAsync(int userId, string permission, int scopeUserId)
        {
            if (userId == scopeUserId) return true;
            if (await HasPermissionAsync(userId, permission)) return true;

            return await _db.UserPermissions
                .AnyAsync(up =>
                    up.UserId == userId
                    && up.Permission.Name == permission
                    && up.ScopeType == UserScopeType
                    && up.ScopeUserId == scopeUserId);
        }

        public async Task<List<string>> GetUserPermissionsAsync(int userId)
        {
            var userRole = await _db.Users
                .Include(u => u.Role)
                .Where(u => u.Id == userId)
                .Select(u => new { u.RoleId, RoleName = u.Role.Name })
                .FirstOrDefaultAsync();

            if (userRole == null) return new List<string>();

            if (userRole.RoleName == Roles.SuperAdmin)
                return await _db.Permissions
                    .OrderBy(p => p.Name)
                    .Select(p => p.Name)
                    .ToListAsync();

            var rolePermissions = await _db.RolePermissions
                .Where(rp => rp.RoleId == userRole.RoleId)
                .Select(rp => rp.Permission.Name)
                .ToListAsync();

            var userPermissions = await _db.UserPermissions
                .Where(up => up.UserId == userId && up.ScopeType == null && up.ScopeUserId == null)
                .Select(up => up.Permission.Name)
                .ToListAsync();

            return rolePermissions
                .Concat(userPermissions)
                .Distinct()
                .OrderBy(name => name)
                .ToList();
        }

        public async Task<List<PermissionDto>> GetAllPermissionsAsync()
        {
            return await _db.Permissions
                .OrderBy(p => p.GroupName)
                .ThenBy(p => p.Name)
                .Select(p => new PermissionDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    GroupName = p.GroupName
                })
                .ToListAsync();
        }

        public async Task<List<RolePermissionDto>> GetRolesWithPermissionsAsync()
        {
            return await _db.Roles
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .Select(r => new RolePermissionDto
                {
                    RoleId = r.Id,
                    RoleName = r.Name,
                    PermissionNames = r.RolePermissions
                        .Select(rp => rp.Permission.Name)
                        .OrderBy(name => name)
                        .ToList()
                })
                .ToListAsync();
        }

        public async Task UpdateRolePermissionsAsync(int roleId, List<string> permissionNames)
        {
            var role = await _db.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId && r.IsActive);

            if (role == null)
                throw new ArgumentException("Role not found");

            var permissions = await GetPermissionsByNameAsync(permissionNames);
            var foundPermissionNames = permissions.Select(p => p.Name).ToHashSet();
            var invalidPermissions = permissionNames
                .Where(name => !foundPermissionNames.Contains(name))
                .ToList();

            if (invalidPermissions.Any())
                throw new ArgumentException($"Invalid permissions: {string.Join(", ", invalidPermissions)}");

            _db.RolePermissions.RemoveRange(role.RolePermissions);

            foreach (var permission in permissions)
            {
                role.RolePermissions.Add(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permission.Id
                });
            }

            await _db.SaveChangesAsync();
        }

        public async Task<List<UserPermissionDto>> GetUsersWithPermissionsAsync()
        {
            var users = await _db.Users
                .Include(u => u.Role)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            var userIds = users.Select(u => u.Id).ToList();
            var assignments = await _db.UserPermissions
                .Include(up => up.Permission)
                .Include(up => up.ScopeUser)
                .Where(up => userIds.Contains(up.UserId))
                .ToListAsync();

            var assignmentsByUser = assignments
                .GroupBy(up => up.UserId)
                .ToDictionary(g => g.Key, g => g.ToList());

            return users.Select(user =>
            {
                assignmentsByUser.TryGetValue(user.Id, out var userAssignments);
                userAssignments ??= new List<UserPermission>();

                return new UserPermissionDto
                {
                    UserId = user.Id,
                    UserName = BuildUserName(user),
                    Email = user.Email,
                    RoleName = user.Role?.Name ?? "",
                    PermissionNames = userAssignments
                        .Where(up => up.ScopeType == null && up.ScopeUserId == null)
                        .Select(up => up.Permission.Name)
                        .OrderBy(name => name)
                        .ToList(),
                    ScopedPermissions = userAssignments
                        .Where(up => up.ScopeType != null || up.ScopeUserId != null)
                        .Select(up => new UserPermissionScopeDto
                        {
                            PermissionName = up.Permission.Name,
                            ScopeType = up.ScopeType,
                            ScopeUserId = up.ScopeUserId,
                            ScopeUserName = up.ScopeUser == null ? null : BuildUserName(up.ScopeUser)
                        })
                        .OrderBy(scope => scope.PermissionName)
                        .ThenBy(scope => scope.ScopeUserName)
                        .ToList()
                };
            }).ToList();
        }

        public async Task<List<PermissionTargetUserDto>> GetPermissionTargetUsersAsync()
        {
            return await _db.Users
                .Include(u => u.Role)
                .Where(u => u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .Select(u => new PermissionTargetUserDto
                {
                    UserId = u.Id,
                    UserName = (u.FirstName + " " + u.LastName).Trim(),
                    Email = u.Email,
                    RoleName = u.Role.Name
                })
                .ToListAsync();
        }

        public async Task UpdateUserPermissionsAsync(int userId, UpdateUserPermissionsDto dto)
        {
            var user = await _db.Users
                .Include(u => u.UserPermissions)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new ArgumentException("User not found");

            var directPermissionNames = dto.PermissionNames
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList();

            var scopedPermissions = dto.ScopedPermissions
                .Where(scope => !string.IsNullOrWhiteSpace(scope.PermissionName))
                .ToList();

            var allPermissionNames = directPermissionNames
                .Concat(scopedPermissions.Select(scope => scope.PermissionName))
                .Distinct()
                .ToList();

            var permissions = await GetPermissionsByNameAsync(allPermissionNames);
            var permissionsByName = permissions.ToDictionary(p => p.Name);
            var invalidPermissions = allPermissionNames
                .Where(name => !permissionsByName.ContainsKey(name))
                .ToList();

            if (invalidPermissions.Any())
                throw new ArgumentException($"Invalid permissions: {string.Join(", ", invalidPermissions)}");

            var scopeUserIds = scopedPermissions
                .Select(scope => scope.ScopeUserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var existingScopeUserIds = await _db.Users
                .Where(u => scopeUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            var missingScopeUserIds = scopeUserIds.Except(existingScopeUserIds).ToList();
            if (missingScopeUserIds.Any())
                throw new ArgumentException($"Invalid target users: {string.Join(", ", missingScopeUserIds)}");

            _db.UserPermissions.RemoveRange(user.UserPermissions);

            var assignmentKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var permissionName in directPermissionNames)
            {
                var permission = permissionsByName[permissionName];
                AddUserPermission(user, permission, null, null, assignmentKeys);
            }

            foreach (var scoped in scopedPermissions)
            {
                var scopeType = string.IsNullOrWhiteSpace(scoped.ScopeType)
                    ? UserScopeType
                    : scoped.ScopeType.Trim();

                if (!string.Equals(scopeType, UserScopeType, StringComparison.OrdinalIgnoreCase))
                    throw new ArgumentException($"Unsupported scope type: {scoped.ScopeType}");

                if (!scoped.ScopeUserId.HasValue)
                    throw new ArgumentException("A target user is required for scoped permissions");

                var permission = permissionsByName[scoped.PermissionName];
                AddUserPermission(user, permission, UserScopeType, scoped.ScopeUserId.Value, assignmentKeys);
            }

            await _db.SaveChangesAsync();
        }

        private async Task<List<Permission>> GetPermissionsByNameAsync(List<string> permissionNames)
        {
            if (permissionNames.Count == 0) return new List<Permission>();

            return await _db.Permissions
                .Where(p => permissionNames.Contains(p.Name))
                .ToListAsync();
        }

        private static void AddUserPermission(
            User user,
            Permission permission,
            string? scopeType,
            int? scopeUserId,
            HashSet<string> assignmentKeys)
        {
            var key = $"{permission.Id}|{scopeType ?? ""}|{scopeUserId?.ToString() ?? ""}";
            if (!assignmentKeys.Add(key)) return;

            user.UserPermissions.Add(new UserPermission
            {
                UserId = user.Id,
                PermissionId = permission.Id,
                ScopeType = scopeType,
                ScopeUserId = scopeUserId
            });
        }

        private static string BuildUserName(User user)
        {
            return $"{user.FirstName} {user.LastName}".Trim();
        }
    }
}
