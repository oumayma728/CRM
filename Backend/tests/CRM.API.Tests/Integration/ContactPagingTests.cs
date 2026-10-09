using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The contact list used to return the WHOLE table (200,000 contacts = 41 MB per request, and it was open to
/// anybody): 10 simultaneous requests took the server from 1.2 GB to 2.6 GB of memory.
/// Now: login required, 50 per page by default, 200 at most, search done by the server.
/// </summary>
public class ContactPagingTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ContactPagingTests(ApiFactory factory)
    {
        _factory = factory;
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (db.Contacts.Any()) return;                                    // the fixture is shared by the tests of this class

        // 250 contacts: 5 of them belong to the agent (id 2), the rest to nobody
        for (var i = 1; i <= 250; i++)
            db.Contacts.Add(new Contact
            {
                Nom = i == 77 ? "Rarissime" : $"Nom{i:D3}",
                Prenom = "Test",
                Telephone = $"06{i:D8}",
                Source = "import",
                DateImport = DateTime.UtcNow.AddMinutes(-i),
                AgentId = i <= 5 ? ApiFactory.Accounts.AgentId : null,
            });
        db.SaveChanges();
    }

    private static int Total(HttpResponseMessage r) => int.Parse(r.Headers.GetValues("X-Total-Count").Single());

    [Fact]
    public async Task ByDefault_OnlyFiftyContactsAreReturned_AndTheTotalIsInTheHeader()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var res = await admin.GetAsync("/api/Contact");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await res.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(50);
        Total(res).Should().Be(250);
    }

    [Fact]
    public async Task PageSize_IsCappedAtTwoHundred_AndPagesCanBeWalked()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var huge = await admin.GetAsync("/api/Contact?pageSize=100000");
        (await huge.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(200, "nobody can ask for the whole table");

        var last = await admin.GetAsync("/api/Contact?page=2&pageSize=200");
        (await last.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(50);   // 250 - 200
        (await admin.GetAsync("/api/Contact?page=-3&pageSize=0")).StatusCode.Should().Be(HttpStatusCode.OK);   // nonsense values are corrected
    }

    [Fact]
    public async Task Search_IsDoneByTheServer()
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        var res = await admin.GetAsync("/api/Contact?search=rarissime");
        var items = await res.Content.ReadFromJsonAsync<JsonElement>();
        items.GetArrayLength().Should().Be(1);
        items[0].GetProperty("nom").GetString().Should().Be("Rarissime");
        Total(res).Should().Be(1);
    }

    [Fact]
    public async Task AnAgent_OnlySeesHisOwnContacts()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);

        var res = await agent.GetAsync("/api/Contact");
        Total(res).Should().Be(5);
        var items = await res.Content.ReadFromJsonAsync<JsonElement>();
        items.EnumerateArray().Should().OnlyContain(c => c.GetProperty("agentId").GetInt64() == ApiFactory.Accounts.AgentId);

        // a contact of nobody (or of a colleague) cannot be opened by id either
        var others = await agent.GetAsync("/api/Contact/200");
        others.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await agent.GetAsync("/api/Contact/1")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task OnlyAdmins_CanDeleteAContact()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var conf = await _factory.ClientFor(ApiFactory.Accounts.Conf1Email);
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);

        // create a throw-away contact so that the other tests of this class still see exactly 250 contacts
        var created = await admin.PostAsJsonAsync("/api/Contact", new { nom = "Jetable", telephone = "0699999999", source = "test" });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt64();

        (await agent.DeleteAsync($"/api/Contact/{id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await conf.DeleteAsync($"/api/Contact/{id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await admin.DeleteAsync($"/api/Contact/{id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
