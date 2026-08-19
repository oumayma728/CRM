namespace CrmApi.Services.Auth;

public interface IPermissionService
{
    Task<bool> UserHasPermissionAsync(int userId, string permission);
    Task<List<string>> GetUserPermissionsAsync(int userId);
    Task<List<string>> GetUserPermissionsAsync(string role);
    Task<List<RolePermissionDto>> GetAllRolePermissionsAsync();
    Task SetRolePermissionAsync(string role, string permission, bool granted);
}

public class RolePermissionDto
{
    public string Role { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public bool Granted { get; set; }
}

public class UserPermissionDto
{
    public List<string> Permissions { get; set; } = new();
    public string Role { get; set; } = string.Empty;
}
