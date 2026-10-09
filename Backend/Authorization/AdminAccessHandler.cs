using Backend.Constants;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Authorization;

/// <summary>
/// One place that decides what the two admin roles may open, instead of listing "ADMIN,SuperAdmin"
/// on every controller (and forgetting one: before, a super admin got a 403 on all the confirmatrice,
/// commercial and agent routes).
///
///   SuperAdmin : passes EVERY role check ([Authorize(Roles = "...")]).
///   ADMIN      : passes every role check too, EXCEPT the routes reserved to the super admin, i.e. the ones
///                declared as [Authorize(Roles = "SuperAdmin")] alone (salaries, ...).
///   Everybody else: the normal rule applies (their role must be in the list).
///
/// How it works: ASP.NET asks every registered handler about each requirement; the request is allowed as
/// soon as ONE handler calls Succeed. This handler only ever adds "yes" answers for admins, it never says
/// "no", so the normal role check keeps working for all the other roles.
/// </summary>
public class AdminAccessHandler : AuthorizationHandler<RolesAuthorizationRequirement>
{
    private const string AdminRole = "ADMIN";

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RolesAuthorizationRequirement requirement)
    {
        var user = context.User;

        if (user.IsInRole(Roles.SuperAdmin))
        {
            context.Succeed(requirement);
        }
        else if (user.IsInRole(AdminRole) && !IsReservedToSuperAdmin(requirement))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }

    /// <summary>True for [Authorize(Roles = "SuperAdmin")] (no other role in the list).</summary>
    internal static bool IsReservedToSuperAdmin(RolesAuthorizationRequirement requirement) =>
        requirement.AllowedRoles.All(r => string.Equals(r, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase));
}
