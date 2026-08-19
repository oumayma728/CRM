using Microsoft.AspNetCore.Authorization;

namespace CrmApi.Authorization;

public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
        : base(permission)
    {
    }
}
