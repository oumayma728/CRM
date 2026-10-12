using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The private messages (api/messages) follow the same rules as the group chat: before, they let an agent write to
/// another agent, and anybody write to the Confirmatrices client and the Commerciaux.
/// </summary>
public class PrivateMessageRulesTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public PrivateMessageRulesTests(ApiFactory factory) => _factory = factory;

    private async Task<HttpStatusCode> Send(string fromEmail, long toId, string content = "Bonjour")
    {
        var client = await _factory.ClientFor(fromEmail);
        // both spellings: the endpoint reads snake_case bodies
        var res = await client.PostAsJsonAsync("/api/messages", new { receiver_id = toId, receiverId = toId, content, is_urgent = false });
        return res.StatusCode;
    }

    [Theory]
    // (sender, receiver, allowed?)
    [InlineData("agent", "agent2", false)]          // agents cannot text each other
    [InlineData("agent", "qualite", true)]
    [InlineData("agent", "admin", true)]
    [InlineData("agent", "superadmin", true)]
    [InlineData("agent", "conf1", true)]
    [InlineData("agent", "commercial", false)]      // only admins write to the commercials
    [InlineData("agent", "confclient", false)]      // ... and to the confirmatrices client
    [InlineData("qualite", "agent", true)]
    [InlineData("qualite", "commercial", false)]
    [InlineData("tech", "confclient", false)]
    [InlineData("conf1", "conf2", true)]
    [InlineData("conf2", "qualite", true)]
    [InlineData("commercial", "admin", true)]       // they only talk with the admins
    [InlineData("commercial", "qualite", false)]
    [InlineData("commercial", "agent", false)]
    [InlineData("confclient", "superadmin", true)]
    [InlineData("confclient", "agent", false)]
    [InlineData("confclient", "conf1", false)]
    [InlineData("admin", "commercial", true)]
    [InlineData("admin", "confclient", true)]
    [InlineData("superadmin", "agent", true)]
    [InlineData("admin", "agent2", true)]
    public async Task PrivateMessage_FollowsTheSameRolesRulesAsTheGroups(string from, string to, bool allowed)
    {
        var status = await Send(Email(from), Id(to));
        status.Should().Be(allowed ? HttpStatusCode.OK : HttpStatusCode.Forbidden, $"{from} -> {to}");
    }

    [Fact]
    public async Task PrivateMessage_RefusesEmptyTooLongAndUnknownReceiver()
    {
        (await Send(ApiFactory.Accounts.AdminEmail, ApiFactory.Accounts.AgentId, "   ")).Should().Be(HttpStatusCode.BadRequest);
        (await Send(ApiFactory.Accounts.AdminEmail, ApiFactory.Accounts.AgentId, new string('x', 2001))).Should().Be(HttpStatusCode.BadRequest);
        (await Send(ApiFactory.Accounts.AdminEmail, 987654)).Should().Be(HttpStatusCode.BadRequest);
    }

    private static string Email(string who) => who switch
    {
        "agent" => ApiFactory.Accounts.AgentEmail, "agent2" => ApiFactory.Accounts.Agent2Email, "qualite" => ApiFactory.Accounts.QualiteEmail,
        "tech" => ApiFactory.Accounts.TechEmail, "commercial" => ApiFactory.Accounts.CommercialEmail, "conf1" => ApiFactory.Accounts.Conf1Email,
        "conf2" => ApiFactory.Accounts.Conf2Email, "confclient" => ApiFactory.Accounts.ConfClientEmail,
        "admin" => ApiFactory.Accounts.AdminEmail, _ => ApiFactory.Accounts.SuperAdminEmail,
    };

    private static long Id(string who) => who switch
    {
        "agent" => ApiFactory.Accounts.AgentId, "agent2" => ApiFactory.Accounts.Agent2Id, "qualite" => ApiFactory.Accounts.QualiteId,
        "tech" => ApiFactory.Accounts.TechId, "commercial" => ApiFactory.Accounts.CommercialId, "conf1" => ApiFactory.Accounts.Conf1Id,
        "conf2" => ApiFactory.Accounts.Conf2Id, "confclient" => ApiFactory.Accounts.ConfClientId,
        "admin" => ApiFactory.Accounts.AdminId, _ => ApiFactory.Accounts.SuperAdminId,
    };
}
