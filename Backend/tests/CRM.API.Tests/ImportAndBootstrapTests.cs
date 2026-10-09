using System.Text;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace CRM.API.Tests;

/// <summary>Phone-column detection, the contact-file import, the password rule and the first-deployment bootstrap.</summary>
public class ImportAndBootstrapTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly string _uploadDir = Path.Combine(Path.GetTempPath(), "crm_tests_" + Guid.NewGuid().ToString("N"));

    public ImportAndBootstrapTests()
    {
        _db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"crm_import_{Guid.NewGuid()}").Options);
    }

    public void Dispose()
    {
        _db.Dispose();
        if (Directory.Exists(_uploadDir)) Directory.Delete(_uploadDir, true);
    }

    // ── PhoneColumnDetector ───────────────────────────────────────────────────────────────

    [Fact]
    public void PhoneColumn_IsNotTheNameColumn_EvenThoughNomContainsTheLetterN()
    {
        // This exact header made the old importer read the NAME column as the phone number: all rows rejected.
        PhoneColumnDetector.Find(new[] { "nom", "prenom", "telephone", "email" }).Should().Be(2);
    }

    [Theory]
    [InlineData(new[] { "Nom", "Prénom", "Téléphone portable", "Email" }, 2)]
    [InlineData(new[] { "Numéro client", "Nom", "Mobile" }, 2)]          // "numero" is weaker than "mobile"
    [InlineData(new[] { "ID", "Name", "Phone" }, 2)]
    [InlineData(new[] { "nom", "tel1", "ville" }, 1)]
    [InlineData(new[] { "nom", "N°", "ville" }, 1)]                       // "N°" is accepted only when it is the whole header
    [InlineData(new[] { "nom", "prenom", "email" }, -1)]                  // no phone column at all
    [InlineData(new[] { "nom", "contact" }, 1)]
    [InlineData(new[] { "nom_contact", "adresse" }, -1)]                  // "contact" inside a longer header is not a phone
    public void PhoneColumn_IsFoundFromTheHeaderNames(string[] headers, int expected) =>
        PhoneColumnDetector.Find(headers).Should().Be(expected);

    // ── PasswordPolicy ─────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("", false)]
    [InlineData("short1A!", false)]                 // too short
    [InlineData("alllowercaseonly", false)]         // one kind of character
    [InlineData("role123", false)]                  // the old hard-coded password
    [InlineData("Test1234!", false)]                // the password of the test accounts
    [InlineData("Correct-Horse-Battery-9", true)]
    [InlineData("monMotDePasse2026X", true)]        // lower + upper + digit
    public void Password_RulesForTheFirstAdmin(string password, bool accepted) =>
        (PasswordPolicy.Validate(password) == null).Should().Be(accepted);

    // ── Contact-file import (technique upload) ─────────────────────────────────────────────

    private static FormFile Csv(string text, string name = "contacts.csv") =>
        new(new MemoryStream(Encoding.UTF8.GetBytes(text)), 0, Encoding.UTF8.GetByteCount(text), "file", name);

    [Fact]
    public async Task Import_CreatesTheRealContacts_AndCountsErrorsAndDuplicates()
    {
        var csv = string.Join("\n",
            "nom,prenom,telephone,email",
            "Dupont,Jean,06 12 34 56 78,j@x.fr",
            "Martin,Luc,0698765432,l@x.fr",
            "Doublon,Paul,0612345678,p@x.fr",       // same number as line 2 (written differently)
            "Sans,Telephone,,s@x.fr",                // missing phone
            "Lettres,Abc,ABC-123,a@x.fr",            // not a number
            "Court,Num,12345,c@x.fr");               // too short

        var f = await FichierImportHelper.SaveUploadAsync(_db, Csv(csv), "Campagne test", "tester", _uploadDir);

        f.Statut.Should().Be(StatutImport.TERMINE);
        f.NombreTotalLignes.Should().Be(6);
        f.NombreContactsImportes.Should().Be(2);
        f.NombreErreurs.Should().Be(4);
        (await _db.Contacts.CountAsync()).Should().Be(2, "contacts must really exist in the database (the old import only counted lines)");

        var jean = await _db.Contacts.SingleAsync(c => c.Nom == "Dupont");
        jean.Telephone.Should().Be("0612345678");         // spaces removed
        jean.FichierImportId.Should().Be(f.Id);
        f.Erreurs.Should().HaveCount(4).And.Contain(e => e.Contains("Ligne 5") && e.Contains("manquant"));
    }

    [Fact]
    public async Task Import_SkipsNumbersThatAlreadyExistInTheDatabase()
    {
        _db.Contacts.Add(new Contact { Nom = "Deja", Telephone = "0600000001", Source = "old", DateImport = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var f = await FichierImportHelper.SaveUploadAsync(_db,
            Csv("nom,telephone\nNouveau,0600000002\nDeja,0600000001"), null, null, _uploadDir);

        f.NombreContactsImportes.Should().Be(1);
        f.NombreErreurs.Should().Be(1);
        (await _db.Contacts.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Import_UnderstandsSemicolonFiles_AndAnyColumnOrder()
    {
        // French Excel exports use ";" and the phone column is rarely the first one
        var f = await FichierImportHelper.SaveUploadAsync(_db,
            Csv("Nom;Prénom;Ville;Téléphone mobile\nDurand;Léa;Lyon;0611223344"), "x", "t", _uploadDir);

        f.NombreContactsImportes.Should().Be(1);
        var c = await _db.Contacts.SingleAsync();
        c.Telephone.Should().Be("0611223344");
        c.Ville.Should().Be("Lyon");
    }

    [Fact]
    public async Task Import_AllLinesInvalid_IsReportedAsError_NotAsSuccess()
    {
        var f = await FichierImportHelper.SaveUploadAsync(_db, Csv("nom,telephone\nA,abc\nB,"), null, null, _uploadDir);

        f.Statut.Should().Be(StatutImport.ERREUR);
        f.NombreContactsImportes.Should().Be(0);
    }

    [Theory]
    [InlineData("virus.exe", "a,b")]
    [InlineData("notes.txt", "a,b")]
    public async Task Import_RefusesFilesThatAreNotCsv(string fileName, string content)
    {
        await FluentActions.Awaiting(() => FichierImportHelper.SaveUploadAsync(_db, Csv(content, fileName), null, null, _uploadDir))
            .Should().ThrowAsync<ArgumentException>().WithMessage("*csv*");
    }

    [Fact]
    public async Task Import_RefusesAFileWithoutPhoneColumn()
    {
        await FluentActions.Awaiting(() => FichierImportHelper.SaveUploadAsync(_db, Csv("nom,prenom,email\nA,B,c@d.fr"), null, null, _uploadDir))
            .Should().ThrowAsync<ArgumentException>().WithMessage("*téléphone*");
    }

    [Theory]
    [InlineData("0612345678", "0612345678")]
    [InlineData("06.12.34.56.78", "0612345678")]
    [InlineData("+33 6 12 34 56 78", "+33612345678")]
    [InlineData("(06) 12-34-56-78", "0612345678")]
    [InlineData("123", null)]
    [InlineData("06123abc78", null)]
    [InlineData("", null)]
    [InlineData("1234567890123456", null)]       // more than 15 digits
    public void PhoneNormalisation(string raw, string? expected) =>
        FichierImportHelper.NormalizePhone(raw).Should().Be(expected);

    // ── First deployment: bootstrap of the first super admin ───────────────────────────────

    private static IConfiguration Config(params (string Key, string? Value)[] pairs) =>
        new ConfigurationBuilder().AddInMemoryCollection(pairs.Select(p => new KeyValuePair<string, string?>(p.Key, p.Value))).Build();

    [Fact]
    public async Task Bootstrap_CreatesTheFirstSuperAdmin_WithAHashedPassword_AndAForcedPasswordChange()
    {
        var cfg = Config(("Bootstrap:AdminEmail", "boss@company.fr"), ("Bootstrap:AdminPassword", "Correct-Horse-Battery-9"));

        (await DbInitializer.BootstrapSuperAdminAsync(_db, cfg, NullLogger.Instance)).Should().BeTrue();

        var admin = await _db.Users.SingleAsync();
        admin.Role.Should().Be("SuperAdmin");
        admin.Email.Should().Be("boss@company.fr");
        admin.MotDePasse.Should().NotContain("Correct-Horse").And.StartWith("$2");           // a BCrypt hash, never the clear text
        BCrypt.Net.BCrypt.Verify("Correct-Horse-Battery-9", admin.MotDePasse).Should().BeTrue();
        admin.MustChangePassword.Should().BeTrue();
        admin.Actif.Should().BeTrue();
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("boss@company.fr", null)]
    [InlineData("boss@company.fr", "role123")]               // the old well-known password
    [InlineData("boss@company.fr", "short")]
    [InlineData("not-an-email", "Correct-Horse-Battery-9")]
    public async Task Bootstrap_CreatesNothing_WhenTheConfigurationIsMissingOrWeak(string? email, string? password)
    {
        var cfg = Config(("Bootstrap:AdminEmail", email), ("Bootstrap:AdminPassword", password));

        (await DbInitializer.BootstrapSuperAdminAsync(_db, cfg, NullLogger.Instance)).Should().BeFalse();
        (await _db.Users.CountAsync()).Should().Be(0, "there is never a default account or a default password");
    }

    [Fact]
    public async Task Bootstrap_DoesNothing_WhenASuperAdminAlreadyExists()
    {
        _db.Users.Add(new SuperAdmin { Nom = "A", Prenom = "B", Email = "first@x.fr", MotDePasse = "hash", Role = "SuperAdmin" });
        await _db.SaveChangesAsync();
        var cfg = Config(("Bootstrap:AdminEmail", "second@x.fr"), ("Bootstrap:AdminPassword", "Correct-Horse-Battery-9"));

        (await DbInitializer.BootstrapSuperAdminAsync(_db, cfg, NullLogger.Instance)).Should().BeFalse();
        (await _db.Users.CountAsync()).Should().Be(1);
    }

    // ── The second user table ("mirror") ────────────────────────────────────────────────────

    [Fact]
    public async Task Mirror_CreatesAUsersRowWithTheSameIdAsEachLoginAccount_AndSeedsTheRoles()
    {
        _db.Users.AddRange(
            new Agent { Id = 11, Nom = "A", Prenom = "Agent", Email = "a@x.fr", MotDePasse = "h", Role = "AGENT" },
            new Admin { Id = 12, Nom = "B", Prenom = "Admin", Email = "b@x.fr", MotDePasse = "h", Role = "ADMIN" },
            new SuperAdmin { Id = 13, Nom = "C", Prenom = "Super", Email = "c@x.fr", MotDePasse = "h", Role = "SuperAdmin" });
        await _db.SaveChangesAsync();

        (await AppUserMirror.SyncAllAsync(_db)).Should().Be(3);

        var mirrors = await _db.AppUsers.Include(u => u.Role).OrderBy(u => u.Id).ToListAsync();
        mirrors.Select(m => m.Id).Should().Equal(11, 12, 13);                         // SAME ids as the accounts
        mirrors.Select(m => m.Role.Name).Should().Equal("Agent", "Admin", "SuperAdmin");
        mirrors.Should().OnlyContain(m => m.PasswordHash == AppUserMirror.NoLoginHash, "a mirror can never be used to log in");
    }

    [Fact]
    public async Task Mirror_IsIdempotent()
    {
        _db.Users.Add(new Agent { Id = 21, Nom = "A", Prenom = "A", Email = "one@x.fr", MotDePasse = "h", Role = "AGENT" });
        await _db.SaveChangesAsync();

        (await AppUserMirror.SyncAllAsync(_db)).Should().Be(1);
        (await AppUserMirror.SyncAllAsync(_db)).Should().Be(0, "running it twice must not duplicate anything");
        (await _db.AppUsers.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Mirror_SkipsAnAccount_WhoseEmailIsAlreadyUsedInTheSecondTable()
    {
        await AppUserMirror.SeedRolesAsync(_db);
        var role = await _db.Roles.FirstAsync();
        _db.AppUsers.Add(new AppUser { Id = 500, FirstName = "Old", LastName = "Row", Email = "dup@x.fr", PasswordHash = "x", RoleId = role.Id });
        _db.Users.Add(new Agent { Id = 22, Nom = "A", Prenom = "A", Email = "dup@x.fr", MotDePasse = "h", Role = "AGENT" });
        await _db.SaveChangesAsync();

        (await AppUserMirror.SyncAllAsync(_db)).Should().Be(0);
        (await _db.AppUsers.CountAsync()).Should().Be(1);
    }
}
