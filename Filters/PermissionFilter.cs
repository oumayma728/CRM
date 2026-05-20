using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Backend.Attributes;
using Backend.Services.Permissions;

namespace Backend.Filters
{
    public class PermissionFilter : IAuthorizationFilter
    {
        private readonly IPermissionService _permissions;

        public PermissionFilter(IPermissionService permissions)
            => _permissions = permissions;

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // checks if user is logged in or not 
            if (context.HttpContext.User.Identity?.IsAuthenticated ?? true)
                return;

            // find required permission for the action from the attribute
            var required = context.ActionDescriptor
                .EndpointMetadata
                .OfType<RequirePermissionAttribute>()
                .FirstOrDefault();

            if (required == null) return;

            if (!_permissions.HasPermission(required.Permission))
                context.Result = new ForbidResult();
        }
    }
}