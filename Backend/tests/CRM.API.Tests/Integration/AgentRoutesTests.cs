using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The two agent controllers work on different tables and have different URLs:
///  - api/Agent  (AgentController)         : the agents who LOG IN (Utilisateur table)
///  - api/Agents (AgentProfilesController) : the campaign-model agents (users table + AgentProfile)
/// These tests prove that both are reachable and wired (dependency injection) after the AgentProfiles rename.
/// </summary>
public class AgentRoutesTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public AgentRoutesTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task ApiAgent_StillWorks_ForTheLoginAgents()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var res = await admin.GetAsync("/api/Agent");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var list = await res.Content.ReadFromJsonAsync<JsonElement>();
        list.GetArrayLength().Should().BeGreaterThan(0);

        (await admin.GetAsync($"/api/Agent/{ApiFactory.Accounts.AgentId}")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ApiAgents_IsWired_AndAnswersWithTheCampaignModelEnvelope()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var res = await admin.GetAsync("/api/Agents");           // proves IAgentProfileService is resolved by DI
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("success").GetBoolean().Should().BeTrue();
        body.GetProperty("data").ValueKind.Should().Be(JsonValueKind.Array);

        (await admin.GetAsync("/api/Agents/987654")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await admin.GetAsync("/api/Agents/987654/campaigns")).StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.OK);
    }

    [Fact]
    public async Task ApiAgents_NeedsALogin_AndAPermission()
    {
        (await _factory.CreateClient().GetAsync("/api/Agents")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // an agent does not have Agents.ViewAll
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        (await agent.GetAsync("/api/Agents")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ApiAgents_AnAgentCanOnlyOpenHisOwnAppointments()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);

        (await agent.GetAsync($"/api/Agents/{ApiFactory.Accounts.AgentId}/appointments")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await agent.GetAsync($"/api/Agents/{ApiFactory.Accounts.Agent2Id}/appointments")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
