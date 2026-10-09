using System.Security.Claims;

namespace Backend.Helpers;

/// <summary>
/// Claims helpers for the controllers ported from khaled-dev-v3.
/// Roles are stored as ADMIN / AGENT / QUALITE / SuperAdmin / CONFIRMATRICE / COMMERCIAL / TECH
/// in the Utilisateur table; those modules reason in lowercase "admin" / "agent" / "qualite",
/// so <see cref="GetRole"/> normalises to that vocabulary.
/// </summary>
public static class UserContextHelper
{
    public static int GetUserId(ClaimsPrincipal user) =>
        int.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value, out var id) ? id : 0;

    public static string GetUsername(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.Email)?.Value ?? user.FindFirst("email")?.Value ?? "";

    public static string GetRole(ClaimsPrincipal user) =>
        NormalizeRole(user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("role")?.Value);

    public static string NormalizeRole(string? role) => (role ?? "").ToUpperInvariant() switch
    {
        "ADMIN" or "SUPERADMIN" => "admin",
        "QUALITE" or "SERVICEQUALITY" => "qualite",
        "AGENT" => "agent",
        "TECH" or "SERVICETECH" => "technique",
        var r => r.ToLowerInvariant(),
    };

    public static bool IsAdmin(ClaimsPrincipal user) => GetRole(user) == "admin";
    public static bool IsAdminOrQualite(ClaimsPrincipal user) { var r = GetRole(user); return r == "admin" || r == "qualite"; }
    public static bool IsAgent(ClaimsPrincipal user) => GetRole(user) == "agent";

    /// <summary>
    /// An agent may only read or change HIS OWN data; admins and super admins may access anyone's.
    /// Used on every route that takes an agent id, so that changing the number in the URL
    /// (or in the request body) does not give access to a colleague's data.
    /// </summary>
    public static bool CanAccessAgentData(ClaimsPrincipal user, long agentId) =>
        IsAdmin(user) || GetUserId(user) == agentId;

    public static bool IsSuperAdmin(ClaimsPrincipal user) => user.IsInRole("SuperAdmin");

    /// <summary>
    /// Salaries are visible to the SuperAdmin and to the agent himself, NOT to the ADMIN role.
    /// Used to blank the salary fields of data that admins are otherwise allowed to read.
    /// </summary>
    public static bool CanSeeSalary(ClaimsPrincipal user, long agentId) =>
        IsSuperAdmin(user) || GetUserId(user) == agentId;
}
