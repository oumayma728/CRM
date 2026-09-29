using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The call-analysis modules (khaled-dev-v3) answer in snake_case, the CRM pipeline modules in
/// camelCase; request bodies of snake_case endpoints accept both conventions.
/// </summary>
public class JsonContractTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public JsonContractTests(ApiFactory factory) => _factory = factory;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login", new { email, motDePasse = ApiFactory.Password });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        return client;
    }

    [Fact]
    public async Task Login_And_Me_UseCamelCase()
    {
        var client = await ClientFor("admin@test.com");
        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");

        me.GetProperty("email").GetString().Should().Be("admin@test.com");
        me.GetProperty("name").GetString().Should().Be("Alice Admin");
        me.GetProperty("role").GetString().Should().Be("ADMIN");
    }

    [Fact]
    public async Task Login_WrongPassword_IsUnauthorized()
    {
        var res = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { email = "admin@test.com", motDePasse = "nope-nope" });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AttendanceStatus_UsesSnakeCase()
    {
        var client = await ClientFor("agent@test.com");
        var raw = await client.GetStringAsync("/api/attendance/status");

        raw.Should().Contain("\"clock_in\"").And.Contain("\"break_type\"").And.NotContain("clockIn");
    }

    [Fact]
    public async Task Permissions_ReturnNormalisedRole()
    {
        var client = await ClientFor("qualite@test.com");
        var perms = await client.GetFromJsonAsync<JsonElement>("/api/auth/permissions");
        perms.GetProperty("role").GetString().Should().Be("qualite");
    }

    [Theory]
    [InlineData("{\"agent_id\":2,\"global_score\":81,\"call_ref\":\"snake\"}")]
    [InlineData("{\"agentId\":2,\"globalScore\":81,\"callRef\":\"camel\"}")]
    public async Task QualityEvaluate_AcceptsSnakeAndCamelBodies(string json)
    {
        var client = await ClientFor("qualite@test.com");
        var res = await client.PostAsync("/api/quality/evaluate", new StringContent(json, Encoding.UTF8, "application/json"));
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var evals = await client.GetFromJsonAsync<JsonElement>("/api/quality/evaluations/2");
        evals.EnumerateArray().Should().Contain(e =>
            e.GetProperty("agent_id").GetInt64() == 2 && Math.Abs(e.GetProperty("global_score").GetDouble() - 81) < 0.01);
    }

    [Fact]
    public async Task QuickUserManagement_CreatesAgentVisibleInAgentsList()
    {
        var client = await ClientFor("admin@test.com");
        var res = await client.PostAsJsonAsync("/api/auth/users/create",
            new { username = "nina@test.com", password = "Temp1234!", name = "Nina Nouvelle", role = "agent" });
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var agents = await client.GetFromJsonAsync<JsonElement>("/api/auth/agents");
        agents.EnumerateArray().Select(a => a.GetProperty("name").GetString()).Should().Contain("Nina Nouvelle");
    }

    [Fact]
    public async Task AgentCannotCreateUsers()
    {
        var client = await ClientFor("agent@test.com");
        var res = await client.PostAsJsonAsync("/api/auth/users/create", new { username = "x@test.com", password = "Temp1234!", name = "X", role = "agent" });
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
