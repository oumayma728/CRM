using CrmApi.Services.Auth;
using Microsoft.AspNetCore.Authorization;

namespace CrmApi.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (!context.User.Identity?.IsAuthenticated ?? true)
            return;

        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                       ?? context.User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return;

        using var scope = _scopeFactory.CreateScope();
        var permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

        var hasPermission = await permissionService.UserHasPermissionAsync(userId, requirement.Permission);
        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
