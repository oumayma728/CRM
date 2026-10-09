using Backend.Data;
using Backend.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CRM.API.Tests.Integration;

/// <summary>
/// Runs the real API pipeline on an in-memory database, without background workers.
/// One test account exists for EACH role of the application (password: <see cref="Password"/>), see <see cref="Accounts"/>.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string Password = "Test1234!";
    private readonly string _dbName = $"crm_api_{Guid.NewGuid()}";

    /// <summary>The ids / e-mails of the test accounts (so that tests never hard-code them).</summary>
    public static class Accounts
    {
        public const string AdminEmail = "admin@test.com";            public const long AdminId = 1;
        public const string AgentEmail = "agent@test.com";            public const long AgentId = 2;
        public const string QualiteEmail = "qualite@test.com";        public const long QualiteId = 3;
        public const string SuperAdminEmail = "superadmin@test.com";  public const long SuperAdminId = 4;
        public const string CommercialEmail = "commercial@test.com";  public const long CommercialId = 5;
        public const string TechEmail = "tech@test.com";              public const long TechId = 6;
        public const string Conf1Email = "conf1@test.com";            public const long Conf1Id = 7;
        public const string Conf2Email = "conf2@test.com";            public const long Conf2Id = 8;
        public const string ConfClientEmail = "confclient@test.com";  public const long ConfClientId = 9;
        public const string Agent2Email = "agent2@test.com";          public const long Agent2Id = 10;   // a colleague of AgentId
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused");
        // appsettings.json no longer holds any secret: the tests bring their own (never used outside the tests)
        builder.UseSetting("Jwt:Secret", "test-only-jwt-secret-not-used-anywhere-else-0123456789");
        builder.UseSetting("RateLimiting:LoginPermitLimit", "1000");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
            services.RemoveAll(typeof(ApplicationDbContext));
            services.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase(_dbName));
            services.RemoveAll(typeof(IHostedService));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hash = BCrypt.Net.BCrypt.HashPassword(Password);
            db.Users.AddRange(
                new Admin { Id = Accounts.AdminId, Prenom = "Alice", Nom = "Admin", Email = Accounts.AdminEmail, MotDePasse = hash, Role = "ADMIN" },
                new Agent { Id = Accounts.AgentId, Prenom = "Karim", Nom = "Agent", Email = Accounts.AgentEmail, MotDePasse = hash, Role = "AGENT", SalaireBase = 900, PrimeAssiduite = 100 },
                new Qualite { Id = Accounts.QualiteId, Prenom = "Quentin", Nom = "Qualite", Email = Accounts.QualiteEmail, MotDePasse = hash, Role = "QUALITE" },
                new SuperAdmin { Id = Accounts.SuperAdminId, Prenom = "Sam", Nom = "Root", Email = Accounts.SuperAdminEmail, MotDePasse = hash, Role = "SuperAdmin" },
                new Commercial { Id = Accounts.CommercialId, Prenom = "Carla", Nom = "Commercial", Email = Accounts.CommercialEmail, MotDePasse = hash, Role = "COMMERCIAL" },
                new Technique { Id = Accounts.TechId, Prenom = "Theo", Nom = "Tech", Email = Accounts.TechEmail, MotDePasse = hash, Role = "TECH" },
                new Confirmatrice { Id = Accounts.Conf1Id, Prenom = "Una", Nom = "Conf", Email = Accounts.Conf1Email, MotDePasse = hash, Role = "CONFIRMATRICE", Type = TypeConfirmatrice.CONF1 },
                new Confirmatrice { Id = Accounts.Conf2Id, Prenom = "Deux", Nom = "Conf", Email = Accounts.Conf2Email, MotDePasse = hash, Role = "CONFIRMATRICE", Type = TypeConfirmatrice.CONF2 },
                new Confirmatrice { Id = Accounts.ConfClientId, Prenom = "Client", Nom = "Conf", Email = Accounts.ConfClientEmail, MotDePasse = hash, Role = "CONFIRMATRICE", Type = TypeConfirmatrice.CONFCLIENT },
                new Agent { Id = Accounts.Agent2Id, Prenom = "Sarah", Nom = "Colleague", Email = Accounts.Agent2Email, MotDePasse = hash, Role = "AGENT", SalaireBase = 900, PrimeAssiduite = 100 });
            db.SaveChanges();
        });
    }
}

internal static class ServiceCollectionTestExtensions
{
    public static void RemoveAll(this IServiceCollection services, Type serviceType)
    {
        foreach (var d in services.Where(d => d.ServiceType == serviceType).ToList()) services.Remove(d);
    }
}
