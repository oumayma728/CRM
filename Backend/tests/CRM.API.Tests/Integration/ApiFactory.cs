using Backend.Data;
using Backend.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CRM.API.Tests.Integration;

/// <summary>Runs the real API pipeline on an in-memory database, without background workers.</summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string Password = "Test1234!";
    private readonly string _dbName = $"crm_api_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused");
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
                new Admin { Id = 1, Prenom = "Alice", Nom = "Admin", Email = "admin@test.com", MotDePasse = hash, Role = "ADMIN" },
                new Agent { Id = 2, Prenom = "Karim", Nom = "Agent", Email = "agent@test.com", MotDePasse = hash, Role = "AGENT" },
                new Qualite { Id = 3, Prenom = "Quentin", Nom = "Qualite", Email = "qualite@test.com", MotDePasse = hash, Role = "QUALITE" });
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
