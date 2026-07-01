// Backend/Services/Permissions/IPermissionService.cs
using Backend.DTOs.Permissions;

namespace Backend.Services.Permissions
{
    public interface IPermissionService
    {
        bool HasPermission(string permission);
        Task<bool> HasPermissionAsync(int userId, string permission);  
        Task<bool> HasPermissionForUserScopeAsync(int userId, string permission, int scopeUserId);
        Task<List<string>> GetUserPermissionsAsync(int userId);
        Task<List<PermissionDto>> GetAllPermissionsAsync();
        Task<List<RolePermissionDto>> GetRolesWithPermissionsAsync();
        Task UpdateRolePermissionsAsync(int roleId, List<string> permissionNames);
        Task<List<UserPermissionDto>> GetUsersWithPermissionsAsync();
        Task<List<PermissionTargetUserDto>> GetPermissionTargetUsersAsync();
        Task UpdateUserPermissionsAsync(int userId, UpdateUserPermissionsDto dto);
    }
}
