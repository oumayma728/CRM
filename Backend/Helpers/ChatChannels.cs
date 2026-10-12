using Backend.Data;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Helpers;

/// <summary>
/// The group chat: one channel per role (+ a general announcement channel). THE SERVER decides who can read and who
/// can write (before, only the browser hid the channels: anybody could call the API for the "ADMIN" channel).
///
/// READ  : admin and super admin read every channel; everybody else reads GENERAL and the channel of his own role.
///
/// WRITE :
///   - admin and super admin write in EVERY channel (General included) and can pick any role;
///   - agents write to Conf 1, Conf 2, Qualité, Technique and Administration; NOT to General, NOT to other agents;
///   - Conf 1, Conf 2, Qualité and Technique write to every channel (General included) except the two reserved ones;
///   - Confirmatrices client and Commerciaux only talk with the admins: they write ONLY to Administration;
///   - nobody except admin and super admin writes to the Confirmatrices client and to the Commerciaux.
/// </summary>
public static class ChatChannels
{
    public const string General = "GENERAL";
    public const string Agents = "AGENTS";
    public const string ConfClient = "CONFCLIENT";
    public const string Commercial = "COMMERCIAL";
    public const int MaxMessageLength = 2000;      // same limit as the ChatMessage.Content column

    public record Channel(string Id, string Label);

    public static readonly IReadOnlyList<Channel> All = new[]
    {
        new Channel(General,     "Général"),
        new Channel(Agents,      "Agents"),
        new Channel("CONF1",     "Confirmatrices 1"),
        new Channel("CONF2",     "Confirmatrices 2"),
        new Channel(ConfClient,  "Confirmatrices client"),
        new Channel(Commercial,  "Commerciaux"),
        new Channel("QUALITE",   "Service Qualité"),
        new Channel("TECHNIQUE", "Service Technique"),
        new Channel("ADMIN",     "Administration"),
    };

    public static bool IsAdmin(string? role) =>
        string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// The channel that belongs to a role (null = none, only GENERAL). A confirmatrice belongs to CONF1, CONF2 or
    /// CONFCLIENT according to her type (CONF1 / CONF2 / CONFCLIENT).
    /// </summary>
    public static string? OwnChannel(string? role, string? confirmatriceType = null) => (role ?? "").ToUpperInvariant() switch
    {
        "AGENT"         => Agents,
        "COMMERCIAL"    => Commercial,
        "QUALITE"       => "QUALITE",
        "TECH"          => "TECHNIQUE",
        "CONFIRMATRICE" => (confirmatriceType ?? "").ToUpperInvariant() switch
        {
            "CONF1"      => "CONF1",
            "CONF2"      => "CONF2",
            "CONFCLIENT" => ConfClient,
            _            => null,
        },
        _ => null,
    };

    /// <summary>"CONF1" / "CONF2" / "CONFCLIENT" for a confirmatrice (read from the database), null for any other role.</summary>
    public static async Task<string?> ConfirmatriceTypeAsync(ApplicationDbContext db, string? role, long userId)
    {
        if (!string.Equals(role, "CONFIRMATRICE", StringComparison.OrdinalIgnoreCase)) return null;
        var type = await db.Set<Confirmatrice>().AsNoTracking().Where(c => c.Id == userId)
            .Select(c => (TypeConfirmatrice?)c.Type).FirstOrDefaultAsync();
        return type?.ToString();
    }

    /// <summary>Upper-case id of a known channel, or null when the name is not a channel.</summary>
    public static string? Normalize(string? channel)
    {
        var id = (channel ?? "").Trim().ToUpperInvariant();
        return All.Any(c => c.Id == id) ? id : null;
    }

    public static bool CanRead(string? role, string? confirmatriceType, string? channel)
    {
        var id = Normalize(channel);
        if (id == null) return false;
        return IsAdmin(role) || id == General || id == OwnChannel(role, confirmatriceType);
    }

    /// <summary>Channels that only admin and super admin may write to.</summary>
    public static bool IsReservedToAdmins(string channelId) => channelId == ConfClient || channelId == Commercial;

    /// <summary>
    /// Confirmatrices client and Commerciaux (and any unknown role) only talk with the admins:
    /// they can write ONLY to the Administration channel.
    /// </summary>
    public static bool IsAdminsOnlyContact(string? role, string? confirmatriceType)
    {
        var r = (role ?? "").ToUpperInvariant();
        return r switch
        {
            "AGENT" or "QUALITE" or "TECH" => false,
            "CONFIRMATRICE" => !((confirmatriceType ?? "").ToUpperInvariant() is "CONF1" or "CONF2"),
            _ => !IsAdmin(role),                        // COMMERCIAL, CONFIRMATRICE client, unknown roles
        };
    }

    public static bool CanWrite(string? role, string? confirmatriceType, string? channel)
    {
        var id = Normalize(channel);
        if (id == null) return false;
        if (IsAdmin(role)) return true;                                   // admin / super admin: every channel
        if (IsReservedToAdmins(id)) return false;                         // Confirmatrices client, Commerciaux
        if (IsAdminsOnlyContact(role, confirmatriceType)) return id == "ADMIN";
        if (string.Equals(role, "AGENT", StringComparison.OrdinalIgnoreCase))
            return id != General && id != Agents;                         // an agent: not in General, not to other agents
        return true;                                                      // Conf 1, Conf 2, Qualité, Technique
    }

    /// <summary>Why a write was refused (message shown to the user).</summary>
    public static string WriteRefusedMessage(string? role, string? confirmatriceType, string channelId)
    {
        if (IsReservedToAdmins(channelId)) return "Seuls les administrateurs peuvent écrire dans ce canal.";
        if (IsAdminsOnlyContact(role, confirmatriceType)) return "Vous ne pouvez écrire qu'aux administrateurs.";
        if (string.Equals(role, "AGENT", StringComparison.OrdinalIgnoreCase))
            return channelId == Agents ? "Les agents ne peuvent pas s'écrire entre eux." : "Les agents ne peuvent pas écrire dans le canal Général.";
        return "Vous ne pouvez pas écrire dans ce canal.";
    }
}
