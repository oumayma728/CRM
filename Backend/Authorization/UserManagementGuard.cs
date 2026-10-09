using System.Security.Claims;
using Backend.Constants;
using Backend.Helpers;

namespace Backend.Authorization;

/// <summary>
/// Rules about WHO may change WHICH account.
///
/// Before: any ADMIN could reset the password of the SUPER ADMIN (or deactivate it) and then log in
/// with it, i.e. an admin could become super admin. The routes only checked "is the caller an admin?",
/// never "which account is being touched?".
///
/// Rule: an account with the role SuperAdmin can only be modified, reset or deactivated by a SuperAdmin.
/// Nobody can deactivate his own account (that would lock the last admin out of the system).
/// </summary>
public static class UserManagementGuard
{
    public const string SuperAdminOnlyMessage =
        "Seul un super administrateur peut modifier ou désactiver un compte super administrateur.";

    public const string CannotDeactivateSelfMessage =
        "Vous ne pouvez pas désactiver votre propre compte.";

    public static bool IsSuperAdmin(string? role) =>
        string.Equals(role, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase);

    /// <summary>May <paramref name="actor"/> modify / reset the password of an account that has <paramref name="targetRole"/>?</summary>
    public static bool CanManage(ClaimsPrincipal actor, string? targetRole) =>
        !IsSuperAdmin(targetRole) || actor.IsInRole(Roles.SuperAdmin);

    /// <summary>True when <paramref name="targetUserId"/> is the account of the caller himself.</summary>
    public static bool IsSelf(ClaimsPrincipal actor, long targetUserId) =>
        UserContextHelper.GetUserId(actor) == targetUserId;
}
