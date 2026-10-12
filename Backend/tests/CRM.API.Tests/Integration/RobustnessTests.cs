using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests.Integration;

/// <summary>
/// Things that went wrong in a real call center: logins locked per IP address (10 of 70 agents could log in at
/// start-up), a deactivated account still working for hours, a health check that said "OK" with the database down,
/// two accounts sharing one e-mail.
/// (The UNIQUE indexes themselves are enforced by PostgreSQL, not by the in-memory test database: they are checked
/// against a real PostgreSQL in the manual verification, see CORRECTIONS_P0.md.)
/// </summary>
public class RobustnessTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public RobustnessTests(ApiFactory factory) => _factory = factory;

    // ── login limit per ACCOUNT, not per IP address ──────────────────────────────────────────────

    [Fact]
    public async Task LoginLimit_IsPerAccount_SoOneAccountBeingHammeredDoesNotLockTheOthers()
    {
        // a factory with the real production limit: 5 attempts / minute / account
        using var strict = _factory.WithWebHostBuilder(b => b.UseSetting("RateLimiting:LoginPermitLimit", "5"));
        var client = strict.CreateClient();

        var codes = new List<HttpStatusCode>();
        for (var i = 0; i < 7; i++)
        {
            var r = await client.PostAsJsonAsync("/api/auth/login", new { email = ApiFactory.Accounts.AgentEmail, motDePasse = "wrong-password" });
            codes.Add(r.StatusCode);
        }
        codes.Take(5).Should().OnlyContain(c => c == HttpStatusCode.Unauthorized, "the first 5 attempts are normal wrong-password answers");
        codes.Skip(5).Should().OnlyContain(c => c == HttpStatusCode.TooManyRequests, "the 6th and 7th attempt on the SAME account are refused");

        // same machine / same IP address, other accounts: not affected (this is what failed with a per-IP limit)
        foreach (var email in new[] { ApiFactory.Accounts.Agent2Email, ApiFactory.Accounts.AdminEmail, ApiFactory.Accounts.QualiteEmail,
                                      ApiFactory.Accounts.TechEmail, ApiFactory.Accounts.Conf1Email, ApiFactory.Accounts.Conf2Email })
        {
            var ok = await client.PostAsJsonAsync("/api/auth/login", new { email, motDePasse = ApiFactory.Password });
            ok.StatusCode.Should().Be(HttpStatusCode.OK, $"{email} must still be able to log in");
        }
    }

    [Fact]
    public async Task LoginLimit_IgnoresCaseAndSpacesInTheEmail()
    {
        using var strict = _factory.WithWebHostBuilder(b => b.UseSetting("RateLimiting:LoginPermitLimit", "3"));
        var client = strict.CreateClient();
        var variants = new[] { "COMMERCIAL@test.com", " commercial@test.com", "Commercial@Test.com", "commercial@test.com" };

        var last = HttpStatusCode.OK;
        foreach (var v in variants)
            last = (await client.PostAsJsonAsync("/api/auth/login", new { email = v, motDePasse = "nope" })).StatusCode;

        last.Should().Be(HttpStatusCode.TooManyRequests, "writing the e-mail in capitals must not give 4 more attempts");
    }

    // ── a deactivated account stops working at once ──────────────────────────────────────────────

    [Fact]
    public async Task ADeactivatedAccount_IsRefusedOnTheVeryNextRequest_EvenWithAValidToken()
    {
        var client = await _factory.ClientFor(ApiFactory.Accounts.Agent2Email);       // valid token, obtained BEFORE the deactivation
        (await client.GetAsync("/api/attendance/status")).StatusCode.Should().Be(HttpStatusCode.OK);

        await SetActive(ApiFactory.Accounts.Agent2Id, false);
        try
        {
            (await client.GetAsync("/api/attendance/status")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
            (await client.GetAsync($"/api/Agent/{ApiFactory.Accounts.Agent2Id}")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
        finally { await SetActive(ApiFactory.Accounts.Agent2Id, true); }

        // re-activated: the same token works again (the account, not the token, is what matters)
        (await client.GetAsync("/api/attendance/status")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task SetActive(long id, bool active)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Set<User>().FirstAsync(u => u.Id == id);
        user.Actif = active;
        await db.SaveChangesAsync();
    }

    // ── health check ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Health_Answers200_WhenTheDatabaseIsThere()
    {
        var res = await _factory.CreateClient().GetAsync("/api/health");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("database").GetString().Should().Be("connected");
    }

    [Fact]
    public async Task Health_Answers503_WhenTheDatabaseDoesNotAnswer()
    {
        // same application, but the database points to a port where nothing listens
        using var broken = _factory.WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
            services.RemoveAll(typeof(ApplicationDbContext));
            services.AddDbContext<ApplicationDbContext>(o =>
                o.UseNpgsql("Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none;Timeout=1;Command Timeout=1"));
        }));

        var res = await broken.CreateClient().GetAsync("/api/health");

        res.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("database").GetString().Should().Be("unreachable");
    }

    // ── two accounts with the same e-mail ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatingAnAccount_WithAnEmailAlreadyUsed_IsRefusedWithAClearMessage()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var body = new { nom = "Doublon", prenom = "Test", email = "doublon@test.com", motDePasse = "Temp-Audit-123!", role = "agent" };

        (await admin.PostAsJsonAsync("/api/admin/utilisateurs", body)).StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await admin.PostAsJsonAsync("/api/admin/utilisateurs", body);
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync()).Should().Contain("déjà utilisé");

        // an e-mail of an existing account, written differently (spaces around it)
        var existing = await admin.PostAsJsonAsync("/api/admin/utilisateurs",
            new { nom = "X", prenom = "Y", email = $" {ApiFactory.Accounts.AgentEmail} ", motDePasse = "Temp-Audit-123!", role = "agent" });
        existing.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // the "quick user" screen gets the same protection
        var quick = await admin.PostAsJsonAsync("/api/auth/users/create",
            new { name = "Q U", email = ApiFactory.Accounts.AgentEmail, password = "Temp-Audit-123!", role = "agent" });
        quick.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        (await db.Set<User>().CountAsync(u => u.Email == "doublon@test.com")).Should().Be(1);
    }

    [Fact]
    public async Task CreatingAnAccount_WithAnUnknownRole_IsA400_NotA500()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var res = await admin.PostAsJsonAsync("/api/admin/utilisateurs",
            new { nom = "R", prenom = "R", email = "role-inconnu@test.com", motDePasse = "Temp-Audit-123!", role = "pirate" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
