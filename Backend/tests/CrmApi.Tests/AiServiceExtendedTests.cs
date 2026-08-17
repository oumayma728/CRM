using CrmApi.DTOs.Ai;
using CrmApi.Services.Ai;
using CrmApi.Services.Chat;
using CrmApi.Data;
using CrmApi.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;

namespace CrmApi.Tests;

public class AiServiceExtendedTests
{
    private readonly AiService _sut;
    private readonly Mock<IChatService> _mockChat;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public AiServiceExtendedTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_ai_ext_test_{Guid.NewGuid()}")
            .Options;
        var context = new ApplicationDbContext(_options);
        _mockChat = new Mock<IChatService>();
        _mockChat.Setup(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ChatResponseDto { Response = "ok" });
        _sut = new AiService(context, _mockChat.Object, Options.Create(new WeightsConfig()));
    }

    [Fact]
    public async Task ScoreEligibilityAsync_NullFields_HandlesGracefully()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = null,
            Chauffage = null,
            Toiture = null,
            Isolation = null,
            Consommation = null,
            CreditScore = null,
            SituationBancaire = null,
            ProjectType = null,
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Score.Should().BeGreaterThanOrEqualTo(0);
        result.Label.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ScoreEligibilityAsync_MaxValues_ReturnsHighScore()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 200000,
            Chauffage = "gaz",
            Toiture = "tuile",
            Isolation = "excellent",
            Consommation = 500,
            CreditScore = 999,
            SituationBancaire = "excellente",
            ProjectType = "PV",
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Score.Should().BeGreaterThan(80);
        result.EligibleAides.Should().BeTrue();
    }

    [Fact]
    public async Task ScoreEligibilityAsync_MinValues_ReturnsLowScore()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 0,
            Chauffage = "",
            Toiture = "",
            Isolation = "",
            Consommation = 0,
            CreditScore = 0,
            SituationBancaire = "",
            ProjectType = "",
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Score.Should().BeLessThanOrEqualTo(30);
    }

    [Fact]
    public async Task DetectFakeRdvAsync_EmptyDto_ReturnsClean()
    {
        var dto = new FakeRdvRequestDto();

        var result = await _sut.DetectFakeRdvAsync(dto);

        result.Verdict.Should().Be("CLEAN");
        result.Flags.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectFakeRdvAsync_WeirdHour_FlagsAsSuspicious()
    {
        var dto = new FakeRdvRequestDto
        {
            QualityScore = 90,
            Revenus = 35000,
            ClientPhone = "0612345678",
            AppointmentTime = "23:00",
        };

        var result = await _sut.DetectFakeRdvAsync(dto);

        result.Flags.Should().Contain(f => f.Contains("Unusual", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DetectRefusalAsync_EmptyTranscript_ReturnsNotDetected()
    {
        var dto = new RefusalCheckDto { Transcript = "" };

        var result = await _sut.DetectRefusalAsync(dto);

        result.RefusalDetected.Should().BeFalse();
    }

    [Fact]
    public async Task DetectRefusalAsync_PriceMotive_ReturnsBudgetCategory()
    {
        var dto = new RefusalCheckDto
        {
            Transcript = "C'est beaucoup trop cher, je ne peux pas me permettre ce prix"
        };

        var result = await _sut.DetectRefusalAsync(dto);

        result.Categories.Should().Contain("budget");
    }

    [Fact]
    public async Task CheckQualificationAsync_EmptyTranscript_ReturnsNotCoherent()
    {
        var dto = new QualificationCheckDto { Qualification = "PV", Transcript = "" };

        var result = await _sut.CheckQualificationAsync(dto);

        result.Coherent.Should().BeFalse();
    }

    [Fact]
    public async Task CheckQualificationAsync_UnknownQualification_ReturnsCoherent()
    {
        var dto = new QualificationCheckDto { Qualification = "", Transcript = "Je veux des panneaux solaires" };

        var result = await _sut.CheckQualificationAsync(dto);

        result.Coherent.Should().BeTrue();
    }

    [Fact]
    public async Task DetectAppointmentAsync_EmptyTranscript_ReturnsNotDetected()
    {
        var dto = new AppointmentDetectDto { Transcript = "" };

        var result = await _sut.DetectAppointmentAsync(dto);

        result.Detected.Should().BeFalse();
    }

    [Fact]
    public async Task AnonymizeTranscriptAsync_MultipleSensitiveData_MasksAll()
    {
        var dto = new AnonymizeDto
        {
            Transcript = "Carte bancaire 1234567890123456 et téléphone 0123456789"
        };

        var result = await _sut.AnonymizeTranscriptAsync(dto);

        result.Anonymized.Should().NotContain("1234567890123456");
        result.Anonymized.Should().NotContain("0123456789");
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_ShortCall_DetectsInactivity()
    {
        var dto = new InactivityRequestDto { CallDuration = 20, Transcription = "" };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeTrue();
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_LongCallNoWords_DetectsInactivity()
    {
        var dto = new InactivityRequestDto { CallDuration = 300, Transcription = "   " };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeTrue();
    }

    [Fact]
    public async Task GetInsightsAsync_AgentWithNoCalls_ReturnsEmpty()
    {
        var result = await _sut.GetInsightsAsync(agentId: -1);

        result.CallStats.Should().NotBeNull();
        result.CallStats.TotalCalls.Should().Be(0);
    }
}
