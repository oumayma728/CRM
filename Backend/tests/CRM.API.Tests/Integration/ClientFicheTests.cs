using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The "fiche client" of the agenda event (projet, civilité, adresse, code postal, commune, GSM, propriétaire depuis,
/// chauffage, chaudière, fournisseur, consommation, électricité, toit, étude, PV, 15 m², travaux, déménagement, personnes):
/// the agent can type it, and every agenda shows it in the side panel.
/// </summary>
public class ClientFicheTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public ClientFicheTests(ApiFactory factory) => _factory = factory;

    private static object FullFiche(string tel) => new
    {
        telephone = tel, source = "Web", agentId = ApiFactory.Accounts.AgentId, nom = "Dupont", prenom = "Marie", civilite = "Mme",
        adresse = "12 rue des Lilas", codePostal = "1000", ville = "Bruxelles", numGSM = "0470123456", projet = "PV",
        estProprietaire = true, proprietaireDepuis = 2012, modeChauffage = "Mazout", ageChaudiere = 8,
        fournisseurEnergie = "Engie", consommationChauffage = "2000L", factureElectricite = "180", etatToiture = "Bon",
        etudePV = false, equipePV = false, surface15m2 = true, travauxEnCours = false, projetDemenagement = false,
        nbPersonnes = 2,
    };

    private static JsonElement Pick(JsonElement list, long id)
    {
        list.ValueKind.Should().Be(JsonValueKind.Array, list.ToString());
        var hit = list.EnumerateArray().Where(x => x.GetProperty("id").GetInt64() == id).ToList();
        hit.Should().HaveCount(1, "RDV {0} must be in the agenda; got: {1}", id, list.ToString());
        return hit[0];
    }

    [Fact]
    public async Task AnAgent_CanCreateAContactWithTheWholeFiche_AndReadItBack()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);

        var created = await agent.PostAsJsonAsync("/api/Contact", FullFiche("0600000101"));
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt64();

        var back = await (await agent.GetAsync($"/api/Contact/{id}")).Content.ReadFromJsonAsync<JsonElement>();
        back.GetProperty("civilite").GetString().Should().Be("Mme");
        back.GetProperty("codePostal").GetString().Should().Be("1000");
        back.GetProperty("ville").GetString().Should().Be("Bruxelles");
        back.GetProperty("numGSM").GetString().Should().Be("0470123456");
        back.GetProperty("projet").GetString().Should().Be("PV");
        back.GetProperty("estProprietaire").GetBoolean().Should().BeTrue();
        back.GetProperty("proprietaireDepuis").GetInt32().Should().Be(2012);
        back.GetProperty("modeChauffage").GetString().Should().Be("Mazout");
        back.GetProperty("ageChaudiere").GetInt32().Should().Be(8);
        back.GetProperty("fournisseurEnergie").GetString().Should().Be("Engie");
        back.GetProperty("consommationChauffage").GetString().Should().Be("2000L");
        back.GetProperty("factureElectricite").GetString().Should().Be("180");
        back.GetProperty("etatToiture").GetString().Should().Be("Bon");
        back.GetProperty("etudePV").GetBoolean().Should().BeFalse();
        back.GetProperty("equipePV").GetBoolean().Should().BeFalse();
        back.GetProperty("surface15m2").GetBoolean().Should().BeTrue();
        back.GetProperty("travauxEnCours").GetBoolean().Should().BeFalse();
        back.GetProperty("projetDemenagement").GetBoolean().Should().BeFalse();
        back.GetProperty("nbPersonnes").GetInt32().Should().Be(2);
    }

    [Fact]
    public async Task UpdatingOneAnswer_NeverErasesTheOthers()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var created = await agent.PostAsJsonAsync("/api/Contact", FullFiche("0600000102"));
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt64();

        // a partial form: only the heating changes, the rest is left empty (null)
        var res = await agent.PutAsJsonAsync($"/api/Contact/{id}", new { telephone = "0600000102", modeChauffage = "Gaz", travauxEnCours = true });
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var back = await res.Content.ReadFromJsonAsync<JsonElement>();
        back.GetProperty("modeChauffage").GetString().Should().Be("Gaz");
        back.GetProperty("travauxEnCours").GetBoolean().Should().BeTrue();
        back.GetProperty("ville").GetString().Should().Be("Bruxelles");        // untouched
        back.GetProperty("source").GetString().Should().Be("Web");             // an empty source does not blank the stored one
        back.GetProperty("proprietaireDepuis").GetInt32().Should().Be(2012);
        back.GetProperty("surface15m2").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task AnAgent_CannotEditTheFicheOfAColleaguesContact()
    {
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        var colleague = await _factory.ClientFor(ApiFactory.Accounts.Agent2Email);
        var created = await agent.PostAsJsonAsync("/api/Contact",
            new { telephone = "0600000103", source = "Web", agentId = ApiFactory.Accounts.AgentId, ville = "Liège" });
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt64();

        (await colleague.PutAsJsonAsync($"/api/Contact/{id}", new { telephone = "0600000103", ville = "Hack" }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await colleague.GetAsync($"/api/Contact/{id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task EveryAgenda_ShowsTheSameFicheInTheSidePanelData()
    {
        long rdvEbi, rdvClient1;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            // one RDV per contact (the model is one-to-one), same fiche on both
            Contact NewContact(string tel) => new()
            {
                Telephone = tel, Source = "Web", DateImport = DateTime.UtcNow, Nom = "Martin", Prenom = "Paul",
                Civilite = "Mr", Adresse = "3 avenue Louise", CodePostal = "1050", Ville = "Ixelles", NumGSM = "0475000000",
                Projet = "PV", EstProprietaire = true, ProprietaireDepuis = new DateTime(2010, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ModeChauffage = "Mazout", AgeChaudiere = 6, FournisseurEnergie = "Luminus", ConsommationChauffage = "2000L",
                FactureElectricite = "180", EtatToiture = "Bon", EtudePV = false, EquipePV = false, Surface15m2 = true,
                TravauxEnCours = false, ProjetDemenagement = false, NombrePersonnes = 2,
            };
            var contactA = NewContact("0600000104");
            var contactB = NewContact("0600000105");
            db.Contacts.AddRange(contactA, contactB);
            await db.SaveChangesAsync();
            var created = DateTime.UtcNow.AddDays(-3);
            var ebi = new RendezVous { ContactId = contactA.Id, AgentId = ApiFactory.Accounts.AgentId, DateCreation = created, DateRendezVous = DateTime.UtcNow.AddDays(2), Statut = StatutRendezVous.CONFIRME, CommercialId = ApiFactory.Accounts.CommercialId };
            var c1 = new RendezVous { ContactId = contactB.Id, AgentId = ApiFactory.Accounts.AgentId, DateCreation = created, DateRendezVous = DateTime.UtcNow.AddDays(3), Statut = StatutRendezVous.CONFIRME_CONF_CALL, TypeRendezVous = "CLIENT1" };
            db.RendezVous.AddRange(ebi, c1);
            await db.SaveChangesAsync();
            rdvEbi = ebi.Id; rdvClient1 = c1.Id;
        }

        static void AssertFiche(JsonElement r)
        {
            r.GetProperty("civilite").GetString().Should().Be("Mr");
            r.GetProperty("contactNom").GetString().Should().Be("Martin");
            r.GetProperty("projet").GetString().Should().Be("PV");
            r.GetProperty("adresse").GetString().Should().Be("3 avenue Louise");
            r.GetProperty("codePostal").GetString().Should().Be("1050");
            r.GetProperty("ville").GetString().Should().Be("Ixelles");
            r.GetProperty("numGSM").GetString().Should().Be("0475000000");
            r.GetProperty("estProprietaire").GetBoolean().Should().BeTrue();
            r.GetProperty("proprietaireDepuis").GetDateTime().Year.Should().Be(2010);
            r.GetProperty("modeChauffage").GetString().Should().Be("Mazout");
            r.GetProperty("ageChaudiere").GetInt32().Should().Be(6);
            r.GetProperty("fournisseurEnergie").GetString().Should().Be("Luminus");
            r.GetProperty("consommationChauffage").GetString().Should().Be("2000L");
            r.GetProperty("factureElectricite").GetString().Should().Be("180");
            r.GetProperty("etatToiture").GetString().Should().Be("Bon");
            r.GetProperty("etudePV").GetBoolean().Should().BeFalse();
            r.GetProperty("equipePV").GetBoolean().Should().BeFalse();
            r.GetProperty("surface15m2").GetBoolean().Should().BeTrue();
            r.GetProperty("travauxEnCours").GetBoolean().Should().BeFalse();
            r.GetProperty("projetDemenagement").GetBoolean().Should().BeFalse();
            r.GetProperty("nombrePersonnes").GetInt32().Should().Be(2);
            r.GetProperty("dateCreation").GetDateTime().Should().BeBefore(DateTime.UtcNow);
        }

        // Conf 1 : agenda EBI (the "Conf Call" agenda)
        var conf1 = await _factory.ClientFor(ApiFactory.Accounts.Conf1Email);
        var ebiList = await (await conf1.GetAsync("/api/confirmation1/agenda-ebi")).Content.ReadFromJsonAsync<JsonElement>();
        AssertFiche(Pick(ebiList, rdvEbi));

        // Conf 2 : agenda EBI and agenda client 1
        var conf2 = await _factory.ClientFor(ApiFactory.Accounts.Conf2Email);
        var ebi2 = await (await conf2.GetAsync("/api/confirmation2/agenda-ebi")).Content.ReadFromJsonAsync<JsonElement>();
        AssertFiche(Pick(ebi2, rdvEbi));
        var cl1 = await (await conf2.GetAsync("/api/confirmation2/agenda-client1")).Content.ReadFromJsonAsync<JsonElement>();
        AssertFiche(Pick(cl1, rdvClient1));

        // Conf client : agenda
        var confClient = await _factory.ClientFor(ApiFactory.Accounts.ConfClientEmail);
        var cc = await (await confClient.GetAsync("/api/confirmation-client/agenda-ebi")).Content.ReadFromJsonAsync<JsonElement>();
        AssertFiche(Pick(cc, rdvClient1));

        // Commercial : own agenda, nested contact object
        var commercial = await _factory.ClientFor(ApiFactory.Accounts.CommercialEmail);
        var list = await (await commercial.GetAsync("/api/commercial/agenda")).Content.ReadFromJsonAsync<JsonElement>();
        var mine = Pick(list, rdvEbi);
        mine.GetProperty("dateCreation").GetDateTime().Should().BeBefore(DateTime.UtcNow);
        var c = mine.GetProperty("contact");
        c.GetProperty("civilite").GetString().Should().Be("Mr");
        c.GetProperty("estProprietaire").GetBoolean().Should().BeTrue();
        c.GetProperty("fournisseurEnergie").GetString().Should().Be("Luminus");
        c.GetProperty("factureElectricite").GetString().Should().Be("180");
        c.GetProperty("surface15m2").GetBoolean().Should().BeTrue();
        c.GetProperty("travauxEnCours").GetBoolean().Should().BeFalse();
        c.GetProperty("projetDemenagement").GetBoolean().Should().BeFalse();
    }
}
