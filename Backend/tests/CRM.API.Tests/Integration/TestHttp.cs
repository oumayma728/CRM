using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace CRM.API.Tests.Integration;

/// <summary>Small helpers shared by the HTTP tests.</summary>
internal static class TestHttp
{
    /// <summary>An HttpClient already logged in as <paramref name="email"/> (real login, real JWT).</summary>
    public static async Task<HttpClient> ClientFor(this ApiFactory factory, string email, string password = ApiFactory.Password)
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login", new { email, motDePasse = password });
        res.StatusCode.Should().Be(System.Net.HttpStatusCode.OK, $"login of {email} must work");
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        return client;
    }

    /// <summary>The JWT of an account (needed for WebSocket tests, where the token travels in the URL).</summary>
    public static async Task<string> TokenFor(this ApiFactory factory, string email)
    {
        var res = await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { email, motDePasse = ApiFactory.Password });
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    /// <summary>Test accounts by short role name, in the order used by the access matrix.</summary>
    public static readonly (string Role, string Email)[] AllRoles =
    {
        ("SuperAdmin", ApiFactory.Accounts.SuperAdminEmail),
        ("Admin", ApiFactory.Accounts.AdminEmail),
        ("Agent", ApiFactory.Accounts.AgentEmail),
        ("Qualite", ApiFactory.Accounts.QualiteEmail),
        ("Commercial", ApiFactory.Accounts.CommercialEmail),
        ("Tech", ApiFactory.Accounts.TechEmail),
        ("Conf1", ApiFactory.Accounts.Conf1Email),
        ("Conf2", ApiFactory.Accounts.Conf2Email),
        ("ConfClient", ApiFactory.Accounts.ConfClientEmail),
    };
}
