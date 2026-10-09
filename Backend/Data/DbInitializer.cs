using Backend.Entities;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

/// <summary>
/// Everything the application needs to start on a BRAND NEW (empty) database:
///   1. create the tables if the database has none,
///   2. fill the reference rows the other modules expect ("roles"),
///   3. create the FIRST super admin from the environment variables Bootstrap__AdminEmail / Bootstrap__AdminPassword,
///   4. mirror the accounts into the second user table (see <see cref="AppUserMirror"/>).
///
/// Before this class, a fresh deployment started with an empty database: every request failed with HTTP 500, there was
/// no way to create the first account except an open web page (InitController, now removed) with a password written in
/// the source code.
///
/// Safety: step 1 does nothing when the database already contains tables (an existing installation is never touched);
/// step 3 does nothing when a super admin already exists, and never uses a default password.
/// </summary>
public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration config, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            await EnsureSchemaAsync(db, config, logger);
            await AppUserMirror.SeedRolesAsync(db);
            await BootstrapSuperAdminAsync(db, config, logger);

            if (config.GetValue("Database:MirrorUsers", true))
                await AppUserMirror.SyncAllAsync(db, logger);
        }
        catch (Exception ex)
        {
            // Never prevent the API from starting (the health page must stay reachable) but make the problem very visible.
            logger.LogError(ex, "Database initialisation failed. The application starts, but it may not work until this is fixed.");
        }
    }

    /// <summary>Creates the tables from the EF model when the database is empty (no-op otherwise).</summary>
    public static async Task EnsureSchemaAsync(ApplicationDbContext db, IConfiguration config, ILogger logger)
    {
        if (!config.GetValue("Database:AutoCreateSchema", true)) return;
        if (!db.Database.IsRelational()) return;               // in-memory test databases need nothing

        // EnsureCreated = create the database if it is missing + create the tables ONLY if the database has no table at all.
        var created = await db.Database.EnsureCreatedAsync();
        if (created)
            logger.LogWarning("Empty database detected: the tables were created from the EF model (EnsureCreated).");
        else
            logger.LogInformation("Database already contains tables: schema left untouched.");
    }

    /// <summary>Creates the first super admin when none exists and credentials were provided in the configuration.</summary>
    public static async Task<bool> BootstrapSuperAdminAsync(ApplicationDbContext db, IConfiguration config, ILogger logger)
    {
        if (await db.Users.AnyAsync(u => u.Role == "SuperAdmin"))
            return false;

        var email = config["Bootstrap:AdminEmail"]?.Trim();
        var password = config["Bootstrap:AdminPassword"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
        {
            logger.LogWarning(
                "No SuperAdmin account exists. Set Bootstrap__AdminEmail and Bootstrap__AdminPassword (environment variables) " +
                "and restart to create the first one.");
            return false;
        }

        if (!email.Contains('@'))
        {
            logger.LogError("Bootstrap__AdminEmail is not a valid e-mail address: no account created.");
            return false;
        }

        var problem = PasswordPolicy.Validate(password);
        if (problem != null)
        {
            logger.LogError("Bootstrap__AdminPassword refused: {Problem} No account created.", problem);
            return false;
        }

        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            logger.LogError("An account with the e-mail {Email} already exists but is not a SuperAdmin: no account created.", email);
            return false;
        }

        db.Users.Add(new SuperAdmin
        {
            Nom = config["Bootstrap:AdminLastName"] ?? "Admin",
            Prenom = config["Bootstrap:AdminFirstName"] ?? "Super",
            Email = email,
            MotDePasse = BCrypt.Net.BCrypt.HashPassword(password),   // only the HASH is stored
            Role = "SuperAdmin",
            Actif = true,
            Statut = "ACTIF",
            // The password was typed in a deployment file or a CI variable: force a change at the first login.
            MustChangePassword = true,
            DateCreation = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        logger.LogWarning("First SuperAdmin account created for {Email}. The password must be changed at the first login.", email);
        return true;
    }
}
