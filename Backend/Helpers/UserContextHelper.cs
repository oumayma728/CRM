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
}
