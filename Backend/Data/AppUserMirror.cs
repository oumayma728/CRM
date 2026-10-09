using Backend.Constants;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

/// <summary>
/// WHY THIS EXISTS (read this one carefully, it is the trickiest part of the project).
///
/// The application has TWO tables of users:
///   - "Utilisateur"  : the real accounts (login, roles). Its Id is the one stored in the login token.
///   - "users"        : used by the campaign / file-import / lead-distribution modules (suppliers, source files,
///                      campaigns...). Those tables have a foreign key to users.id.
/// The modules of the second family read the user id from the token (= Utilisateur.Id) and write it in a column
/// that points to users.id. When no row exists in "users" with that id, the database refuses the write
/// (FK violation) and the import answers HTTP 500. That is why file import failed on a clean installation.
///
/// STOP-GAP: for every Utilisateur we make sure a row with the SAME id exists in "users" (a "mirror").
/// The real fix is to have a single user table; that is a bigger refactoring to be decided with a senior.
///
/// To avoid id collisions the sequence of "users" is moved to 1,000,000: rows created by the campaign
/// module's own "create agent" feature get ids above that, mirrors keep the Utilisateur ids (below).
/// </summary>
public static class AppUserMirror
{
    public const string NoLoginHash = "!mirror-no-login";        // not a valid BCrypt hash: nobody can log in with it
    private const long SequenceFloor = 1_000_000;

    // Utilisateur.Role (database value) -> name of the row in "roles"
    private static readonly Dictionary<string, string> RoleNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["SuperAdmin"] = Roles.SuperAdmin,
        ["ADMIN"] = Roles.Admin,
        ["AGENT"] = Roles.Agent,
        ["CONFIRMATRICE"] = Roles.Confirmatrice,
        ["COMMERCIAL"] = Roles.Commercial,
        ["TECH"] = Roles.ServiceTech,
        ["QUALITE"] = Roles.ServiceQuality,
    };

    /// <summary>Creates the rows of the "roles" table that the other modules expect (idempotent).</summary>
    public static async Task SeedRolesAsync(ApplicationDbContext db)
    {
        var existing = (await db.Roles.Select(r => r.Name).ToListAsync()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var missing = RoleNames.Values.Distinct().Where(n => !existing.Contains(n)).ToList();
        if (missing.Count == 0) return;

        db.Roles.AddRange(missing.Select(n => new Role { Name = n, IsActive = true, CreatedAt = DateTime.UtcNow }));
        await db.SaveChangesAsync();
    }

    /// <summary>Mirrors every Utilisateur that has no "users" row yet. Returns how many rows were created.</summary>
    public static Task<int> SyncAllAsync(ApplicationDbContext db, ILogger? logger = null) => SyncAsync(db, null, logger);

    /// <summary>Mirrors one Utilisateur (call it right after creating an account).</summary>
    public static Task<int> EnsureAsync(ApplicationDbContext db, long utilisateurId, ILogger? logger = null) =>
        SyncAsync(db, utilisateurId, logger);

    private static async Task<int> SyncAsync(ApplicationDbContext db, long? onlyId, ILogger? logger)
    {
        await SeedRolesAsync(db);

        var query = db.Users.AsNoTracking().AsQueryable();
        if (onlyId.HasValue) query = query.Where(u => u.Id == onlyId.Value);
        var accounts = await query.Select(u => new { u.Id, u.Nom, u.Prenom, u.Email, u.Role, u.Actif }).ToListAsync();
        if (accounts.Count == 0) return 0;

        var existing = await db.AppUsers.IgnoreQueryFilters().AsNoTracking().Select(u => new { u.Id, u.Email }).ToListAsync();
        var usedIds = existing.Select(e => (long)e.Id).ToHashSet();
        var usedEmails = existing.Select(e => e.Email).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var roleIds = await db.Roles.ToDictionaryAsync(r => r.Name, r => r.Id, StringComparer.OrdinalIgnoreCase);

        var toAdd = new List<AppUser>();
        foreach (var a in accounts)
        {
            if (usedIds.Contains(a.Id)) continue;                                   // already mirrored (or the id is taken)
            if (a.Id > int.MaxValue) continue;
            if (usedEmails.Contains(a.Email))
            {
                logger?.LogWarning("Mirror skipped for {Email}: another row of 'users' already uses this e-mail.", a.Email);
                continue;
            }
            if (!RoleNames.TryGetValue(a.Role, out var roleName) || !roleIds.TryGetValue(roleName, out var roleId))
            {
                logger?.LogWarning("Mirror skipped for {Email}: unknown role '{Role}'.", a.Email, a.Role);
                continue;
            }

            toAdd.Add(new AppUser
            {
                Id = (int)a.Id,                      // SAME id as the login account: this is the whole point
                FirstName = a.Prenom,
                LastName = a.Nom,
                Email = a.Email,
                PasswordHash = NoLoginHash,
                RoleId = roleId,
                IsActive = a.Actif,
                IsOnline = false,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        if (toAdd.Count == 0) return 0;

        db.AppUsers.AddRange(toAdd);
        await db.SaveChangesAsync();

        // PostgreSQL does not advance the id counter when ids are given explicitly: move it above our ids.
        if (db.Database.IsNpgsql())
        {
            await db.Database.ExecuteSqlRawAsync(
                $"SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM users), {SequenceFloor}))");
        }

        logger?.LogInformation("Mirrored {Count} account(s) into the 'users' table.", toAdd.Count);
        return toAdd.Count;
    }
}
