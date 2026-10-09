using System.Net;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests.Integration;

/// <summary>
/// One test per security hole found by the production-readiness audit, so that none of them can come back unnoticed.
/// (The audit found 26 actions answering without any login; 100 tests were green anyway because none asked "what if
/// nobody is logged in?")
/// </summary>
public class SecurityRegressionTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public SecurityRegressionTests(ApiFactory factory) => _factory = factory;

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Nothing answers without a login
    // ─────────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("GET", "/api/Contact")]
    [InlineData("GET", "/api/Contact/1")]
    [InlineData("GET", "/api/Contact/export/csv")]
    [InlineData("GET", "/api/Agent")]
    [InlineData("GET", "/api/Agent/2")]
    [InlineData("GET", "/api/Agent/2/remuneration?annee=2026&mois=9")]
    [InlineData("GET", "/api/Agent/2/appels")]
    [InlineData("GET", "/api/agent/2/dashboard")]
    [InlineData("GET", "/api/agent/2/historique")]
    [InlineData("GET", "/api/agent/2/agenda")]
    [InlineData("GET", "/api/leads")]
    [InlineData("GET", "/api/leads/stats")]
    [InlineData("GET", "/api/performance/agents-from-calls")]
    public async Task RouteThatWasOpen_NowNeedsALogin(string method, string url)
    {
        var res = await _factory.CreateClient().SendAsync(new HttpRequestMessage(new HttpMethod(method), url));
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{method} {url} must not answer to anonymous callers");
    }

    [Theory]
    [InlineData("POST", "/api/Contact")]
    [InlineData("PUT", "/api/Contact/1")]
    [InlineData("DELETE", "/api/Contact/1")]
    [InlineData("POST", "/api/Agent")]
    [InlineData("PUT", "/api/Agent/2")]
    [InlineData("DELETE", "/api/Agent/2")]
    [InlineData("POST", "/api/Agent/appels")]
    [InlineData("POST", "/api/leads/import")]
    public async Task WriteRouteThatWasOpen_NowNeedsALogin(string method, string url)
    {
        var req = new HttpRequestMessage(new HttpMethod(method), url);
        if (method != "DELETE") req.Content = JsonContent.Create(new { });
        var res = await _factory.CreateClient().SendAsync(req);
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{method} {url} must not accept anonymous callers");
    }

    [Fact]
    public async Task TheOpenInitPage_NoLongerExists()
    {
        // InitController created an admin with the password "role123" and listed all the users, without any login.
        var client = _factory.CreateClient();
        (await client.PostAsync("/api/Init/create-admin", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.GetAsync("/api/Init/users")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. An agent only sees his own data
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Agent_CannotReadAColleaguesData()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var colleague = ApiFactory.Accounts.Agent2Id;

        foreach (var url in new[]
        {
            $"/api/Agent/{colleague}",
            $"/api/Agent/{colleague}/appels",
            $"/api/Agent/{colleague}/pointages",
            $"/api/Agent/{colleague}/performance?annee=2026&mois=9",
            $"/api/Agent/{colleague}/remuneration?annee=2026&mois=9",
            $"/api/agent/{colleague}/dashboard",
            $"/api/agent/{colleague}/historique",
            $"/api/agent/{colleague}/agenda",
            $"/api/Contact/agent/{colleague}/a-appeler",
            $"/api/Contact/agent/{colleague}/scored",
        })
            (await agent.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Forbidden, $"GET {url}");
    }

    [Fact]
    public async Task Agent_CanStillReadHisOwnData()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var me = ApiFactory.Accounts.AgentId;

        foreach (var url in new[] { $"/api/Agent/{me}", $"/api/Agent/{me}/appels", $"/api/Contact/agent/{me}/a-appeler" })
            (await agent.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.OK, $"GET {url}");
    }

    [Fact]
    public async Task Agent_CannotRecordACallForAColleague()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var forged = new { agentId = ApiFactory.Accounts.Agent2Id, contactId = 1, dureeSecondes = 30, qualification = "NRP" };

        (await agent.PostAsJsonAsync("/api/Agent/appels", forged)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task OnlyAdmins_CanCreateOrDeleteAnAgent_ButAnAgentCannot()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var newAgent = new { nom = "X", prenom = "Y", email = "x@y.fr", motDePasse = "Secret123!", typeContrat = "PLEIN_TEMPS" };

        (await agent.PostAsJsonAsync("/api/Agent", newAgent)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await agent.DeleteAsync($"/api/Agent/{ApiFactory.Accounts.Agent2Id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. Salaries are invisible to the Admin role
    // ─────────────────────────────────────────────────────────────────────────────

    private static async Task<JsonElement> ReadAgent(HttpClient c, long id) =>
        (await c.GetFromJsonAsync<JsonElement>($"/api/Agent/{id}"));

    [Fact]
    public async Task SuperAdmin_SeesSalaries_Admin_DoesNot()
    {
        var super = await _factory.ClientFor(ApiFactory.Accounts.SuperAdminEmail);
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var id = ApiFactory.Accounts.AgentId;

        (await ReadAgent(super, id)).GetProperty("salaireBase").GetDouble().Should().Be(900);
        (await ReadAgent(admin, id)).GetProperty("salaireBase").GetDouble().Should().Be(0, "an ADMIN has no access to salaries");

        // same rule on the list
        var listForAdmin = await admin.GetFromJsonAsync<JsonElement>("/api/Agent");
        listForAdmin.EnumerateArray().Should().OnlyContain(a => a.GetProperty("salaireBase").GetDouble() == 0);
        var listForSuper = await super.GetFromJsonAsync<JsonElement>("/api/Agent");
        listForSuper.EnumerateArray().Should().Contain(a => a.GetProperty("salaireBase").GetDouble() == 900);
    }

    [Fact]
    public async Task Agent_SeesHisOwnSalary_ButOthersGetOnlyNames()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        (await ReadAgent(agent, ApiFactory.Accounts.AgentId)).GetProperty("salaireBase").GetDouble().Should().Be(900);

        // the list used by the "create a contact" page: names only, no e-mail, no pay
        var list = await agent.GetFromJsonAsync<JsonElement>("/api/Agent");
        list.EnumerateArray().Should().OnlyContain(a =>
            a.GetProperty("salaireBase").GetDouble() == 0 && a.GetProperty("email").GetString() == "");
    }

    [Fact]
    public async Task Admin_CannotReadAnAgentsEstimatedPay_SuperAdminCan()
    {
        var url = $"/api/Agent/{ApiFactory.Accounts.AgentId}/remuneration?annee=2026&mois=9";
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var super = await _factory.ClientFor(ApiFactory.Accounts.SuperAdminEmail);

        (await admin.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await super.GetAsync(url)).StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. An admin cannot take over the super admin account
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Admin_CannotChangeThePasswordOfTheSuperAdmin()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var res = await admin.PutAsJsonAsync($"/api/auth/users/{ApiFactory.Accounts.SuperAdminId}", new { password = "Hijacked123!" });
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // and the old password still works: nothing was changed
        var login = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { email = ApiFactory.Accounts.SuperAdminEmail, motDePasse = ApiFactory.Password });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Admin_CannotResetOrDeactivateTheSuperAdmin()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var target = ApiFactory.Accounts.SuperAdminId;

        (await admin.PostAsJsonAsync("/api/auth/admin-reset-password", new { userId = target })).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
        (await admin.DeleteAsync($"/api/auth/users/{target}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await admin.DeleteAsync($"/api/admin/utilisateurs/{target}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Nobody_CanDeactivateHisOwnAccount()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        (await admin.DeleteAsync($"/api/auth/users/{ApiFactory.Accounts.AdminId}")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SuperAdmin_CanStillManageAccounts_AndAnAdminCanManageOrdinaryOnes()
    {
        var super = await _factory.ClientFor(ApiFactory.Accounts.SuperAdminEmail);
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        // an admin creates an ordinary account, then changes its password: allowed
        var email = $"newagent_{Guid.NewGuid():N}@test.com";
        var created = await admin.PostAsJsonAsync("/api/auth/users/create",
            new { name = "New Agent", email, password = "Abcdef12345!", role = "agent" });
        created.StatusCode.Should().Be(HttpStatusCode.OK);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("user_id").GetInt64();

        (await admin.PutAsJsonAsync($"/api/auth/users/{id}", new { password = "Another12345!" })).StatusCode.Should().Be(HttpStatusCode.OK);
        // the super admin can do the same, and can touch the admin account
        (await super.PutAsJsonAsync($"/api/auth/users/{id}", new { name = "Renamed Agent" })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await super.PutAsJsonAsync($"/api/auth/users/{ApiFactory.Accounts.AdminId}", new { name = "Alice Admin" })).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AnAccountCreatedByAnAdmin_IsMirroredInTheSecondUserTable()
    {
        // The file import / campaign modules need a row in "users" with the same id as the login account.
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        var email = $"mirror_{Guid.NewGuid():N}@test.com";
        var res = await admin.PostAsJsonAsync("/api/auth/users/create", new { name = "Mir Ror", email, password = "Abcdef12345!", role = "agent" });
        var id = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("user_id").GetInt64();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.AppUsers.Any(u => u.Id == (int)id && u.Email == email).Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. The real-time messaging socket needs a login, and only for your own id
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WebSocket_RefusesAnonymous_AndSomeoneElsesId_AcceptsYourOwn()
    {
        var ws = _factory.Server.CreateWebSocketClient();
        var agentId = ApiFactory.Accounts.AgentId;
        var token = await _factory.TokenFor(ApiFactory.Accounts.AgentEmail);

        // nobody logged in -> refused
        await FluentActions.Awaiting(() => ws.ConnectAsync(new Uri($"ws://localhost/ws/messages/{agentId}"), CancellationToken.None))
            .Should().ThrowAsync<Exception>();

        // logged in as the agent but asking for the socket of a colleague -> refused
        await FluentActions.Awaiting(() => ws.ConnectAsync(
                new Uri($"ws://localhost/ws/messages/{ApiFactory.Accounts.Agent2Id}?access_token={token}"), CancellationToken.None))
            .Should().ThrowAsync<Exception>();

        // own id + own token -> connected
        using var socket = await ws.ConnectAsync(new Uri($"ws://localhost/ws/messages/{agentId}?access_token={token}"), CancellationToken.None);
        socket.State.Should().Be(WebSocketState.Open);
        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. The password-reset requests are validated by the framework (there used to be two copies of these
    //    DTOs; C# silently picked the copy WITHOUT validation, so the ModelState check did nothing)
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_RejectsAnInvalidEmail_WithAValidationError()
    {
        var res = await _factory.CreateClient().PostAsJsonAsync("/api/auth/forgot-password", new { email = "pas-un-email" });

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("Email");
    }

    [Fact]
    public async Task ResetPassword_RejectsAShortPasswordAndAMissingToken_WithAValidationError()
    {
        var client = _factory.CreateClient();

        var tooShort = await client.PostAsJsonAsync("/api/auth/reset-password", new { token = "abc", newPassword = "1234" });
        tooShort.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await tooShort.Content.ReadAsStringAsync()).Should().Contain("NewPassword");

        var noToken = await client.PostAsJsonAsync("/api/auth/reset-password", new { newPassword = "Un-bon-mot-de-passe-1" });
        noToken.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await noToken.Content.ReadAsStringAsync()).Should().Contain("Token");
    }
}
