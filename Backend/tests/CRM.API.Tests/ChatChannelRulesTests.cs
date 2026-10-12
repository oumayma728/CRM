using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;
using Backend.Hubs;
using CRM.API.Tests.Integration;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests;

/// <summary>
/// The group chat rules, enforced by the SERVER (before, only the browser hid the channels):
///  - one channel per role (Agents, Confirmatrices 1, Confirmatrices 2, Confirmatrices client, Commerciaux, Qualité,
///    Technique, Administration) + GENERAL (announcements)
///  - read : admin / super admin read everything; the others read GENERAL + the channel of their own role
///  - write: admin / super admin: everywhere. Agents: Conf 1, Conf 2, Qualité, Technique, Administration (not General,
///           not other agents). Conf 1 / Conf 2 / Qualité / Technique: everywhere except the two reserved groups.
///           Confirmatrices client and Commerciaux: ONLY to Administration. Nobody but the admins writes to them.
/// </summary>
public class ChatChannelRulesTests : IClassFixture<ApiFactory>
{
    private static readonly string[] AllChannels = { "GENERAL", "AGENTS", "CONF1", "CONF2", "CONFCLIENT", "COMMERCIAL", "QUALITE", "TECHNIQUE", "ADMIN" };
    private readonly ApiFactory _factory;
    public ChatChannelRulesTests(ApiFactory factory) => _factory = factory;

    private static readonly string[] Everyone = AllChannels;
    private static readonly string[] ToAdminsOnly = { "ADMIN" };
    private static readonly string[] AgentWrites = { "CONF1", "CONF2", "QUALITE", "TECHNIQUE", "ADMIN" };
    private static readonly string[] StaffWrites = { "GENERAL", "AGENTS", "CONF1", "CONF2", "QUALITE", "TECHNIQUE", "ADMIN" };

    // role, confirmatrice type, channels it READS, channels it WRITES TO
    public static IEnumerable<object?[]> Roles() => new[]
    {
        new object?[] { "SuperAdmin",    null,         AllChannels, Everyone },
        new object?[] { "ADMIN",         null,         AllChannels, Everyone },
        new object?[] { "AGENT",         null,         new[] { "GENERAL", "AGENTS" }, AgentWrites },
        new object?[] { "CONFIRMATRICE", "CONF1",      new[] { "GENERAL", "CONF1" }, StaffWrites },
        new object?[] { "CONFIRMATRICE", "CONF2",      new[] { "GENERAL", "CONF2" }, StaffWrites },
        new object?[] { "QUALITE",       null,         new[] { "GENERAL", "QUALITE" }, StaffWrites },
        new object?[] { "TECH",          null,         new[] { "GENERAL", "TECHNIQUE" }, StaffWrites },
        new object?[] { "CONFIRMATRICE", "CONFCLIENT", new[] { "GENERAL", "CONFCLIENT" }, ToAdminsOnly },
        new object?[] { "COMMERCIAL",    null,         new[] { "GENERAL", "COMMERCIAL" }, ToAdminsOnly },
    };

    [Theory]
    [MemberData(nameof(Roles))]
    public void ReadAndWriteRules_ForEveryRoleAndEveryChannel(string role, string? confType, string[] canRead, string[] canWrite)
    {
        foreach (var channel in AllChannels)
        {
            ChatChannels.CanRead(role, confType, channel).Should().Be(canRead.Contains(channel), $"{role}/{confType} reading {channel}");
            ChatChannels.CanWrite(role, confType, channel).Should().Be(canWrite.Contains(channel), $"{role}/{confType} writing to {channel}");
        }
        ChatChannels.CanRead(role, confType, "nope").Should().BeFalse();
        ChatChannels.CanWrite(role, confType, "nope").Should().BeFalse();
        ChatChannels.CanRead(role, confType, canRead[0].ToLowerInvariant()).Should().BeTrue("channel names are not case sensitive");
    }

    [Fact]
    public void TheRulesFromTheBusiness_InPlainSentences()
    {
        // admin and super admin talk in General and can text any role
        foreach (var admin in new[] { "ADMIN", "SuperAdmin" })
            AllChannels.Should().OnlyContain(c => ChatChannels.CanWrite(admin, null, c));

        // an agent texts the other roles (except the two reserved ones), does not write in General, cannot text another agent
        ChatChannels.CanWrite("AGENT", null, "GENERAL").Should().BeFalse();
        ChatChannels.CanWrite("AGENT", null, "AGENTS").Should().BeFalse();
        foreach (var c in new[] { "CONF1", "CONF2", "QUALITE", "TECHNIQUE", "ADMIN" }) ChatChannels.CanWrite("AGENT", null, c).Should().BeTrue(c);

        // Conf 1, Conf 2, Qualité, Technique: text all roles AND write in General
        foreach (var (role, type) in new[] { ("CONFIRMATRICE", "CONF1"), ("CONFIRMATRICE", "CONF2"), ("QUALITE", (string?)null), ("TECH", null) })
        {
            ChatChannels.CanWrite(role, type, "GENERAL").Should().BeTrue($"{role}/{type} writes in General");
            ChatChannels.CanWrite(role, type, "AGENTS").Should().BeTrue($"{role}/{type} can text the agents");
        }

        // Confirmatrices client and Commerciaux only talk with the admins; nobody else can text them
        foreach (var (role, type) in new[] { ("CONFIRMATRICE", "CONFCLIENT"), ("COMMERCIAL", (string?)null) })
        {
            foreach (var c in AllChannels.Where(c => c != "ADMIN"))
                ChatChannels.CanWrite(role, type, c).Should().BeFalse($"{role}/{type} must not write to {c}");
            ChatChannels.CanWrite(role, type, "ADMIN").Should().BeTrue();
        }
        foreach (var (role, type) in new[] { ("AGENT", (string?)null), ("QUALITE", null), ("TECH", null), ("CONFIRMATRICE", "CONF1"), ("CONFIRMATRICE", "CONF2") })
        {
            ChatChannels.CanWrite(role, type, "CONFCLIENT").Should().BeFalse($"{role}/{type} must not text the confirmatrices client");
            ChatChannels.CanWrite(role, type, "COMMERCIAL").Should().BeFalse($"{role}/{type} must not text the commercials");
        }
    }

    // ── the HTTP API ─────────────────────────────────────────────────────────────────────────────

    private async Task SeedHistory()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (await db.ChatMessages.AnyAsync()) return;
        foreach (var ch in AllChannels)
            db.ChatMessages.Add(new ChatMessage { SenderId = 1, SenderName = "Alice", SenderRole = "ADMIN", Content = $"hello {ch}", Channel = ch, SentAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
    }

    private static string Flags(List<JsonElement> list, string id)
    {
        var c = list.SingleOrDefault(x => x.GetProperty("id").GetString() == id);
        return c.ValueKind == JsonValueKind.Undefined ? "(absent)"
            : $"{(c.GetProperty("canRead").GetBoolean() ? "R" : "-")}{(c.GetProperty("canWrite").GetBoolean() ? "W" : "-")}";
    }

    private async Task<List<JsonElement>> ChannelsOf(string email) =>
        (await (await _factory.ClientFor(email)).GetFromJsonAsync<JsonElement>("/api/chat")).EnumerateArray().ToList();

    [Fact]
    public async Task ChannelList_Agent()
    {
        var l = await ChannelsOf(ApiFactory.Accounts.AgentEmail);
        Flags(l, "GENERAL").Should().Be("R-", "an agent reads the announcements but does not write in General");
        Flags(l, "AGENTS").Should().Be("R-", "an agent reads his own channel but cannot write to other agents");
        foreach (var other in new[] { "CONF1", "CONF2", "QUALITE", "TECHNIQUE", "ADMIN" })
            Flags(l, other).Should().Be("-W", $"an agent can write to {other} without reading it");
        Flags(l, "CONFCLIENT").Should().Be("(absent)", "only admins can text the Confirmatrices client");
        Flags(l, "COMMERCIAL").Should().Be("(absent)", "only admins can text the commercials");
    }

    [Fact]
    public async Task ChannelList_Conf1_Conf2_Qualite_Technique_WriteEverywhereExceptTheTwoReservedGroups()
    {
        foreach (var (email, own) in new[] { (ApiFactory.Accounts.Conf1Email, "CONF1"), (ApiFactory.Accounts.Conf2Email, "CONF2"),
                                             (ApiFactory.Accounts.QualiteEmail, "QUALITE"), (ApiFactory.Accounts.TechEmail, "TECHNIQUE") })
        {
            var l = await ChannelsOf(email);
            Flags(l, "GENERAL").Should().Be("RW", $"{email} writes in General");
            Flags(l, own).Should().Be("RW");
            foreach (var other in new[] { "AGENTS", "CONF1", "CONF2", "QUALITE", "TECHNIQUE", "ADMIN" }.Where(c => c != own))
                Flags(l, other).Should().Be("-W", $"{email} can text {other}");
            Flags(l, "CONFCLIENT").Should().Be("(absent)");
            Flags(l, "COMMERCIAL").Should().Be("(absent)");
        }
    }

    [Fact]
    public async Task ChannelList_ConfirmatriceClient_AndCommercial_OnlyTalkWithTheAdmins()
    {
        var cc = await ChannelsOf(ApiFactory.Accounts.ConfClientEmail);
        cc.Select(c => c.GetProperty("id").GetString()).Should().BeEquivalentTo("GENERAL", "CONFCLIENT", "ADMIN");
        Flags(cc, "GENERAL").Should().Be("R-");
        Flags(cc, "CONFCLIENT").Should().Be("R-", "they read their group, only admins write to it");
        Flags(cc, "ADMIN").Should().Be("-W", "the only group they can write to");

        var co = await ChannelsOf(ApiFactory.Accounts.CommercialEmail);
        co.Select(c => c.GetProperty("id").GetString()).Should().BeEquivalentTo("GENERAL", "COMMERCIAL", "ADMIN");
        Flags(co, "COMMERCIAL").Should().Be("R-");
        Flags(co, "ADMIN").Should().Be("-W");
    }

    [Fact]
    public async Task ChannelList_Admins_SeeAndWriteEverywhere()
    {
        foreach (var admin in new[] { ApiFactory.Accounts.AdminEmail, ApiFactory.Accounts.SuperAdminEmail })
        {
            var a = await ChannelsOf(admin);
            a.Should().HaveCount(9).And.OnlyContain(c => c.GetProperty("canRead").GetBoolean() && c.GetProperty("canWrite").GetBoolean());
        }
    }

    [Theory]
    [InlineData("agent", "ADMIN", HttpStatusCode.Forbidden)]          // this was readable by anybody
    [InlineData("agent", "QUALITE", HttpStatusCode.Forbidden)]
    [InlineData("agent", "CONF1", HttpStatusCode.Forbidden)]
    [InlineData("agent", "AGENTS", HttpStatusCode.OK)]
    [InlineData("agent", "general", HttpStatusCode.OK)]
    [InlineData("agent", "NOPE", HttpStatusCode.NotFound)]
    [InlineData("qualite", "AGENTS", HttpStatusCode.Forbidden)]       // qualité can WRITE to the agents but not read their channel
    [InlineData("qualite", "QUALITE", HttpStatusCode.OK)]
    [InlineData("tech", "TECHNIQUE", HttpStatusCode.OK)]
    [InlineData("tech", "ADMIN", HttpStatusCode.Forbidden)]
    [InlineData("commercial", "COMMERCIAL", HttpStatusCode.OK)]
    [InlineData("commercial", "TECHNIQUE", HttpStatusCode.Forbidden)]
    [InlineData("conf1", "CONF1", HttpStatusCode.OK)]
    [InlineData("conf1", "CONF2", HttpStatusCode.Forbidden)]
    [InlineData("conf1", "ADMIN", HttpStatusCode.Forbidden)]
    [InlineData("conf2", "CONF2", HttpStatusCode.OK)]
    [InlineData("conf2", "CONF1", HttpStatusCode.Forbidden)]
    [InlineData("confclient", "CONFCLIENT", HttpStatusCode.OK)]
    [InlineData("confclient", "CONF1", HttpStatusCode.Forbidden)]
    [InlineData("admin", "ADMIN", HttpStatusCode.OK)]
    [InlineData("admin", "AGENTS", HttpStatusCode.OK)]
    [InlineData("admin", "CONFCLIENT", HttpStatusCode.OK)]
    [InlineData("superadmin", "ADMIN", HttpStatusCode.OK)]
    [InlineData("superadmin", "COMMERCIAL", HttpStatusCode.OK)]
    public async Task ChannelHistory_IsOnlyReadableByTheRolesAllowedToRead(string who, string channel, HttpStatusCode expected)
    {
        await SeedHistory();
        var email = who switch
        {
            "agent" => ApiFactory.Accounts.AgentEmail, "qualite" => ApiFactory.Accounts.QualiteEmail, "tech" => ApiFactory.Accounts.TechEmail,
            "commercial" => ApiFactory.Accounts.CommercialEmail, "conf1" => ApiFactory.Accounts.Conf1Email,
            "conf2" => ApiFactory.Accounts.Conf2Email, "confclient" => ApiFactory.Accounts.ConfClientEmail,
            "admin" => ApiFactory.Accounts.AdminEmail, _ => ApiFactory.Accounts.SuperAdminEmail,
        };
        var client = await _factory.ClientFor(email);

        (await client.GetAsync($"/api/chat/{channel}")).StatusCode.Should().Be(expected);
    }

    [Fact]
    public async Task Anonymous_CannotReadAnyChannel()
    {
        (await _factory.CreateClient().GetAsync("/api/chat/GENERAL")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _factory.CreateClient().GetAsync("/api/chat")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── the real-time hub (SendMessage / JoinChannel), tested without a network ─────────────────────

    private (ChatHub hub, Recorder rec, ApplicationDbContext db) HubFor(string role, long id = 2, string? confType = null)
    {
        var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase($"hub_{Guid.NewGuid()}").Options);
        if (confType != null)
        {
            db.Users.Add(new Confirmatrice { Id = id, Nom = "C", Prenom = "C", Email = "c@x.fr", MotDePasse = "x", Role = "CONFIRMATRICE", Type = Enum.Parse<TypeConfirmatrice>(confType) });
            db.SaveChanges();
        }
        var rec = new Recorder();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim("name", "Test User"), new Claim(ClaimTypes.Role, role),
        }, "test"));
        var hub = new ChatHub(db) { Context = new FakeContext(user), Clients = new FakeClients(rec), Groups = new FakeGroups(rec) };
        return (hub, rec, db);
    }

    [Fact]
    public async Task Hub_AnAgentCannotWriteToAgents_NorToGeneral_AndNothingIsSaved()
    {
        var (hub, rec, db) = HubFor("AGENT");

        await ((Func<Task>)(() => hub.SendMessage("agents", "salut les collègues"))).Should().ThrowAsync<HubException>().WithMessage("*agents ne peuvent pas s'écrire*");
        await ((Func<Task>)(() => hub.SendMessage("GENERAL", "hello"))).Should().ThrowAsync<HubException>().WithMessage("*agents ne peuvent pas écrire*");

        (await db.ChatMessages.CountAsync()).Should().Be(0);
        rec.Sent.Should().BeEmpty();
    }

    [Theory]
    [InlineData("AGENT", null), InlineData("QUALITE", null), InlineData("TECH", null), InlineData("CONFIRMATRICE", "CONF1"), InlineData("CONFIRMATRICE", "CONF2"),
     InlineData("COMMERCIAL", null), InlineData("CONFIRMATRICE", "CONFCLIENT")]
    public async Task Hub_OnlyAdminsCanTextTheConfirmatricesClientAndTheCommercials(string role, string? type)
    {
        var (hub, _, db) = HubFor(role, confType: type);

        await ((Func<Task>)(() => hub.SendMessage("CONFCLIENT", "bonjour"))).Should().ThrowAsync<HubException>().WithMessage("*administrateurs*");
        await ((Func<Task>)(() => hub.SendMessage("COMMERCIAL", "bonjour"))).Should().ThrowAsync<HubException>().WithMessage("*administrateurs*");
        (await db.ChatMessages.CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData("COMMERCIAL", null), InlineData("CONFIRMATRICE", "CONFCLIENT")]
    public async Task Hub_ConfirmatriceClientAndCommercial_CanWriteOnlyToAdministration(string role, string? type)
    {
        foreach (var channel in new[] { "GENERAL", "AGENTS", "CONF1", "CONF2", "QUALITE", "TECHNIQUE" })
        {
            var (hub, _, db) = HubFor(role, id: 9, confType: type);
            await ((Func<Task>)(() => hub.SendMessage(channel, "bonjour"))).Should().ThrowAsync<HubException>().WithMessage("*qu'aux administrateurs*");
            (await db.ChatMessages.CountAsync()).Should().Be(0);
        }

        var (ok, rec, saved) = HubFor(role, id: 9, confType: type);
        await ok.SendMessage("ADMIN", "J'ai besoin d'aide");
        (await saved.ChatMessages.SingleAsync()).Channel.Should().Be("ADMIN");
        rec.Sent.Should().Contain(x => x.Target == "group:ADMIN");
    }

    [Theory]
    [InlineData("AGENT", null, "QUALITE"), InlineData("AGENT", null, "ADMIN"), InlineData("AGENT", null, "CONF1"), InlineData("AGENT", null, "CONF2"), InlineData("AGENT", null, "TECHNIQUE"),
     InlineData("QUALITE", null, "AGENTS"), InlineData("TECH", null, "AGENTS"), InlineData("CONFIRMATRICE", "CONF1", "AGENTS"), InlineData("CONFIRMATRICE", "CONF2", "AGENTS"),
     InlineData("QUALITE", null, "CONF2"), InlineData("TECH", null, "QUALITE"), InlineData("CONFIRMATRICE", "CONF1", "TECHNIQUE"), InlineData("CONFIRMATRICE", "CONF2", "CONF1"),
     InlineData("QUALITE", null, "GENERAL"), InlineData("TECH", null, "GENERAL"), InlineData("CONFIRMATRICE", "CONF1", "GENERAL"), InlineData("CONFIRMATRICE", "CONF2", "GENERAL")]
    public async Task Hub_AllowedWrites_ArePersisted_BroadcastToTheGroup_AndEchoedToTheSender(string role, string? type, string channel)
    {
        var (hub, rec, db) = HubFor(role, confType: type);

        await hub.SendMessage(channel, "  Bonjour  ");

        var saved = await db.ChatMessages.SingleAsync();
        saved.Channel.Should().Be(channel);
        saved.Content.Should().Be("Bonjour");
        saved.SenderRole.Should().Be(role);
        rec.Sent.Should().Contain(x => x.Target == "group:" + channel && x.Method == "ReceiveMessage", "the readers of the group get it live");
        rec.Sent.Should().Contain(x => x.Target == "caller" && x.Method == "ReceiveMessage", "the sender always gets his own message back");
    }

    [Theory]
    [InlineData("ADMIN")]
    [InlineData("SuperAdmin")]
    public async Task Hub_AdminsCanWriteToAnyChannel(string role)
    {
        foreach (var channel in AllChannels)
        {
            var (hub, _, db) = HubFor(role);
            await hub.SendMessage(channel, "annonce");
            (await db.ChatMessages.SingleAsync()).Channel.Should().Be(channel);
        }
    }

    [Fact]
    public async Task Hub_RefusesEmptyMessages_TooLongMessages_AndUnknownChannels()
    {
        var (hub, _, db) = HubFor("ADMIN");
        await ((Func<Task>)(() => hub.SendMessage("GENERAL", "   "))).Should().ThrowAsync<HubException>().WithMessage("*vide*");
        await ((Func<Task>)(() => hub.SendMessage("GENERAL", new string('x', 2001)))).Should().ThrowAsync<HubException>().WithMessage("*trop long*");
        await ((Func<Task>)(() => hub.SendMessage("PIRATES", "hello"))).Should().ThrowAsync<HubException>().WithMessage("*inconnu*");
        (await db.ChatMessages.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Hub_JoinChannel_IsRefusedForAChannelTheRoleCannotRead()
    {
        var (hub, rec, _) = HubFor("AGENT");

        await ((Func<Task>)(() => hub.JoinChannel("ADMIN"))).Should().ThrowAsync<HubException>();
        await ((Func<Task>)(() => hub.JoinChannel("QUALITE"))).Should().ThrowAsync<HubException>();
        rec.Joined.Should().BeEmpty();

        await hub.JoinChannel("agents");
        await hub.JoinChannel("GENERAL");
        rec.Joined.Should().BeEquivalentTo("AGENTS", "GENERAL");
    }

    [Theory]
    [InlineData("CONF1", "CONF1", "CONF2")]
    [InlineData("CONF2", "CONF2", "CONF1")]
    [InlineData("CONFCLIENT", "CONFCLIENT", "CONF1")]
    public async Task Hub_AConfirmatriceJoinsOnlyTheChannelOfHerType(string type, string own, string other)
    {
        var (hub, rec, _) = HubFor("CONFIRMATRICE", id: 7, confType: type);

        await ((Func<Task>)(() => hub.JoinChannel(other))).Should().ThrowAsync<HubException>();
        await hub.JoinChannel(own);

        rec.Joined.Should().BeEquivalentTo(new[] { own });
    }

    // ── tiny fakes for the SignalR objects ───────────────────────────────────────────────────────

    private sealed class Recorder
    {
        public List<(string Target, string Method)> Sent { get; } = new();
        public List<string> Joined { get; } = new();
    }
    private sealed class FakeProxy(Recorder rec, string target) : IClientProxy
    {
        public Task SendCoreAsync(string method, object?[] args, CancellationToken ct = default) { rec.Sent.Add((target, method)); return Task.CompletedTask; }
    }
    private sealed class FakeClients(Recorder rec) : IHubCallerClients
    {
        public IClientProxy Caller => new FakeProxy(rec, "caller");
        public IClientProxy Others => new FakeProxy(rec, "others");
        public IClientProxy All => new FakeProxy(rec, "all");
        public IClientProxy AllExcept(IReadOnlyList<string> excluded) => new FakeProxy(rec, "allExcept");
        public IClientProxy Client(string connectionId) => new FakeProxy(rec, "client:" + connectionId);
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => new FakeProxy(rec, "clients");
        public IClientProxy Group(string groupName) => new FakeProxy(rec, "group:" + groupName);
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excluded) => new FakeProxy(rec, "group:" + groupName);
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => new FakeProxy(rec, "groups");
        public IClientProxy OthersInGroup(string groupName) => new FakeProxy(rec, "othersInGroup:" + groupName);
        public IClientProxy User(string userId) => new FakeProxy(rec, "user:" + userId);
        public IClientProxy Users(IReadOnlyList<string> userIds) => new FakeProxy(rec, "users");
    }
    private sealed class FakeGroups(Recorder rec) : IGroupManager
    {
        public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken ct = default) { rec.Joined.Add(groupName); return Task.CompletedTask; }
        public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken ct = default) => Task.CompletedTask;
    }
    private sealed class FakeContext(ClaimsPrincipal user) : HubCallerContext
    {
        public override string ConnectionId => "conn-1";
        public override string? UserIdentifier => null;
        public override ClaimsPrincipal? User => user;
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features { get; } = new FeatureCollection();
        public override CancellationToken ConnectionAborted => CancellationToken.None;
        public override void Abort() { }
    }
}
