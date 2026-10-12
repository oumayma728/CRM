using System.Text;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;
using Backend.Services.Email;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace CRM.API.Tests;

/// <summary>
/// Leftovers of the import (refused file kept on disk, whole Contacts table loaded in memory) and of the e-mails
/// (STARTTLS, unconfigured SMTP, role labels that did not match the real role values).
/// </summary>
public class ImportAndEmailFixesTests : IDisposable
{
    private readonly ApplicationDbContext _db = new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase($"crm_p1_{Guid.NewGuid()}").Options);
    private readonly string _uploadDir = Path.Combine(Path.GetTempPath(), "crm_tests_p1_" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        _db.Dispose();
        if (Directory.Exists(_uploadDir)) Directory.Delete(_uploadDir, true);
    }

    private static FormFile Csv(string text, string name = "contacts.csv") =>
        new(new MemoryStream(Encoding.UTF8.GetBytes(text)), 0, Encoding.UTF8.GetByteCount(text), "file", name);

    private int FilesKept() => Directory.Exists(_uploadDir) ? Directory.GetFiles(_uploadDir).Length : 0;

    // ── a refused file is not kept on disk ───────────────────────────────────────────────────────

    [Fact]
    public async Task ARefusedFile_LeavesNoCopyOnDisk()
    {
        // no phone column -> refused
        await FluentActions.Awaiting(() => FichierImportHelper.SaveUploadAsync(_db, Csv("nom,prenom,email\nA,B,c@d.fr"), null, null, _uploadDir))
            .Should().ThrowAsync<ArgumentException>();
        FilesKept().Should().Be(0);
    }

    [Fact]
    public async Task AFileWithNoValidPhone_LeavesNoCopyOnDisk_ButAFileThatImportedContactsIsKept()
    {
        var empty = await FichierImportHelper.SaveUploadAsync(_db, Csv("nom,telephone\nA,abc\nB,12"), null, null, _uploadDir);
        empty.NombreContactsImportes.Should().Be(0);
        FilesKept().Should().Be(0, "nothing was imported: no reason to keep the copy");

        var good = await FichierImportHelper.SaveUploadAsync(_db, Csv("nom,telephone\nA,0611111111"), null, null, _uploadDir);
        good.NombreContactsImportes.Should().Be(1);
        FilesKept().Should().Be(1, "the copy of an imported file stays as an audit trail");
    }

    // ── duplicates against the database are found batch by batch (the table is no longer loaded in memory) ──

    [Fact]
    public async Task DuplicatesAgainstTheDatabase_AreSkipped_AcrossSeveralBatches()
    {
        // 2,500 contacts already in the database
        _db.Contacts.AddRange(Enumerable.Range(0, 2500).Select(i => new Contact
        {
            Nom = "Existant", Telephone = $"07{i:D8}", Source = "old", Statut = "A_APPELER", DateImport = DateTime.UtcNow,
        }));
        await _db.SaveChangesAsync();

        // a file with 3,300 lines (more than 3 batches of 1,000): 2,100 already known + 1,200 new
        var sb = new StringBuilder("nom,telephone\n");
        for (var i = 0; i < 2100; i++) sb.Append($"Connu{i},07{i:D8}\n");
        for (var i = 0; i < 1200; i++) sb.Append($"Nouveau{i},06{i:D8}\n");

        var f = await FichierImportHelper.SaveUploadAsync(_db, Csv(sb.ToString()), null, null, _uploadDir);

        f.NombreContactsImportes.Should().Be(1200);
        f.NombreErreurs.Should().Be(2100, "the 2,100 known phones are counted as duplicates");
        (await _db.Contacts.CountAsync()).Should().Be(3700);
        (await _db.Contacts.GroupBy(c => c.Telephone).CountAsync(g => g.Count() > 1)).Should().Be(0, "no phone exists twice");
    }

    // ── e-mails ──────────────────────────────────────────────────────────────────────────────────

    private static IConfiguration Config(params (string Key, string? Value)[] pairs) =>
        new ConfigurationBuilder().AddInMemoryCollection(pairs.Select(p => new KeyValuePair<string, string?>(p.Key, p.Value))).Build();

    [Theory]
    [InlineData("SuperAdmin", "Super administrateur")]
    [InlineData("ADMIN", "Administrateur")]
    [InlineData("AGENT", "Agent")]
    [InlineData("CONFIRMATRICE", "Confirmatrice")]
    [InlineData("QUALITE", "Service Qualité")]   // was written "QUAL": never matched, the raw value was shown
    [InlineData("TECH", "Service Technique")]
    [InlineData("COMMERCIAL", "Commercial")]
    public void WelcomeEmail_ShowsAReadableLabelForEveryRealRole(string role, string label) =>
        EmailService.RoleLabel(role).Should().Be(label);

    [Fact]
    public void Smtp_UsesSsl_OnPort587_BecauseGmailRequiresStartTls_UnlessTheSettingSaysOtherwise()
    {
        EmailService.UseSsl(Config(), 587).Should().BeTrue("the old default (false) gave 'Must issue a STARTTLS command first'");
        EmailService.UseSsl(Config(), 465).Should().BeTrue();
        EmailService.UseSsl(Config(), 25).Should().BeFalse();
        EmailService.UseSsl(Config(("Email:UseSsl", "false")), 587).Should().BeFalse("an explicit setting wins");
        EmailService.UseSsl(Config(("Email:UseSsl", "true")), 25).Should().BeTrue();
    }

    [Fact]
    public async Task UnconfiguredSmtp_IsSkippedQuietly_NoStackTraceNoException()
    {
        var sample = Config(("Email:SmtpHost", "smtp.gmail.com"), ("Email:SenderEmail", "VOTRE_EMAIL@gmail.com"), ("Email:Password", "VOTRE_APP_PASSWORD"));
        EmailService.IsSmtpConfigured(sample).Should().BeFalse("the placeholders of the sample appsettings are not a configuration");
        EmailService.IsSmtpConfigured(Config()).Should().BeFalse();
        EmailService.IsSmtpConfigured(Config(("Email:SenderEmail", "crm@societe.fr"), ("Email:Password", "secret"))).Should().BeTrue();

        var service = new EmailService(sample, NullLogger<EmailService>.Instance);
        await FluentActions.Awaiting(() => service.SendWelcomeEmailAsync("a@b.fr", "N", "P", "AGENT", "x")).Should().NotThrowAsync();
        await FluentActions.Awaiting(() => service.SendPasswordResetEmailAsync("a@b.fr", "N", "P", "token")).Should().NotThrowAsync();
    }
}
