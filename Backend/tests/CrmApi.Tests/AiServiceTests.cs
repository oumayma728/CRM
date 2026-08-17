using CrmApi.DTOs.Ai;
using CrmApi.Services.Ai;
using CrmApi.Services.Chat;
using CrmApi.Data;
using CrmApi.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AiServiceTests
{
    private readonly AiService _sut;
    private readonly Mock<IChatService> _mockChat;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public AiServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_test_{Guid.NewGuid()}")
            .Options;
        var context = new ApplicationDbContext(_options);
        _mockChat = new Mock<IChatService>();
        _mockChat.Setup(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ChatResponseDto { Response = "ok" });
        _sut = new AiService(context, _mockChat.Object, Options.Create(new WeightsConfig()));
    }

    [Fact]
    public async Task ScoreEligibilityAsync_HighIncome_ReturnsHighScore()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 45000,
            Chauffage = "gaz",
            Toiture = "tuile",
            Isolation = "non isole",
            Consommation = 350,
            CreditScore = 750,
            SituationBancaire = "bonne",
            ProjectType = "PV"
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Score.Should().BeGreaterThanOrEqualTo(70);
        result.Label.Should().Be("Éligible");
        result.Color.Should().Be("green");
        result.EligibleAides.Should().BeTrue();
    }

    [Fact]
    public async Task ScoreEligibilityAsync_LowIncome_ReturnsLowScore()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 5000,
            Chauffage = "bois",
            Toiture = "chaume",
            Isolation = "bon",
            Consommation = 50,
            CreditScore = 300,
            SituationBancaire = "mauvaise"
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Score.Should().BeLessThan(40);
        result.Label.Should().Be("Non éligible");
        result.Color.Should().Be("red");
    }

    [Fact]
    public async Task ScoreEligibilityAsync_MediumIncome_ReturnsVerifyStatus()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 15000,
            Chauffage = "electrique",
            Toiture = "tuile",
            Isolation = "moyen",
            Consommation = 100,
            CreditScore = 500,
            SituationBancaire = "stable"
        };

        var result = await _sut.ScoreEligibilityAsync(dto);

        result.Label.Should().Be("À vérifier");
        result.Color.Should().Be("orange");
    }

    [Fact]
    public async Task AnalyzeEligibilityAsync_LogsToDatabase()
    {
        var dto = new EligibilityRequestDto
        {
            Revenus = 35000,
            Chauffage = "fioul",
            Toiture = "ardoise",
            Isolation = "mauvais",
            Consommation = 300,
            CreditScore = 700,
            SituationBancaire = "bonne",
            ProjectType = "PAC"
        };

        var result = await _sut.AnalyzeEligibilityAsync(userId: 1, dto);

        result.Score.Should().BeGreaterThan(0);
        result.ProjectType.Should().Be("PAC");
    }

    [Fact]
    public async Task DetectFakeRdvAsync_LowQualityScore_ReturnsHighRisk()
    {
        var dto = new FakeRdvRequestDto
        {
            QualityScore = 10,
            Revenus = 90000,
            ClientPhone = "123",
            AppointmentTime = "23:30"
        };

        var result = await _sut.DetectFakeRdvAsync(dto);

        result.Verdict.Should().Be("HIGH_RISK");
        result.RiskScore.Should().BeGreaterThanOrEqualTo(60);
        result.Flags.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DetectFakeRdvAsync_CleanData_ReturnsClean()
    {
        var dto = new FakeRdvRequestDto
        {
            QualityScore = 80,
            Revenus = 35000,
            ClientPhone = "0612345678",
            AppointmentTime = "10:00"
        };

        var result = await _sut.DetectFakeRdvAsync(dto);

        result.Verdict.Should().Be("CLEAN");
        result.RiskScore.Should().BeLessThan(30);
    }

    [Fact]
    public async Task CheckQualificationAsync_CoherentTranscript_ReturnsCoherent()
    {
        var dto = new QualificationCheckDto
        {
            Qualification = "PV",
            Transcript = "Je veux installer des panneaux solaires sur ma toiture pour produire de l'électricité"
        };

        var result = await _sut.CheckQualificationAsync(dto);

        result.Coherent.Should().BeTrue();
        result.RefusalDetected.Should().BeFalse();
    }

    [Fact]
    public async Task CheckQualificationAsync_RefusalDetected_ReturnsNotCoherent()
    {
        var dto = new QualificationCheckDto
        {
            Qualification = "PV",
            Transcript = "Non merci, pas intéressé, trop cher pour moi, je réfléchis"
        };

        var result = await _sut.CheckQualificationAsync(dto);

        result.Coherent.Should().BeFalse();
        result.RefusalDetected.Should().BeTrue();
    }

    [Fact]
    public async Task CheckQualificationAsync_IncoherentTranscript_ReturnsNotCoherent()
    {
        var dto = new QualificationCheckDto
        {
            Qualification = "PV",
            Transcript = "Bonjour, je voudrais parler du temps qu'il fait aujourd'hui"
        };

        var result = await _sut.CheckQualificationAsync(dto);

        result.Coherent.Should().BeFalse();
    }

    [Fact]
    public async Task DetectRefusalAsync_BudgetMotive_ReturnsSuggestedResponse()
    {
        var dto = new RefusalCheckDto
        {
            Transcript = "C'est trop cher pour moi, je n'ai pas le budget"
        };

        var result = await _sut.DetectRefusalAsync(dto);

        result.RefusalDetected.Should().BeTrue();
        result.PrimaryMotive.Should().Be("budget");
        result.SuggestedResponse.Should().Contain("aides financières");
    }

    [Fact]
    public async Task DetectRefusalAsync_NoRefusal_ReturnsNotDetected()
    {
        var dto = new RefusalCheckDto
        {
            Transcript = "Oui, je suis très intéressé, quand pouvez-vous venir ?"
        };

        var result = await _sut.DetectRefusalAsync(dto);

        result.RefusalDetected.Should().BeFalse();
        result.Confidence.Should().Be(0);
    }

    [Fact]
    public async Task DetectRefusalAsync_TimingMotive_ReturnsTimingCategory()
    {
        var dto = new RefusalCheckDto
        {
            Transcript = "Je n'ai pas le temps maintenant, je suis très occupé au travail"
        };

        var result = await _sut.DetectRefusalAsync(dto);

        result.Categories.Should().Contain("timing");
        result.PrimaryMotive.Should().Be("timing");
    }

    [Fact]
    public async Task DetectAppointmentAsync_WithRdvKeyword_ReturnsDetected()
    {
        var dto = new AppointmentDetectDto
        {
            Transcript = "Je vous propose un rendez-vous le 15 mars à 14h"
        };

        var result = await _sut.DetectAppointmentAsync(dto);

        result.Detected.Should().BeTrue();
        result.Confidence.Should().Be(70);
        result.RequiresValidation.Should().BeTrue();
    }

    [Fact]
    public async Task DetectAppointmentAsync_NoDate_ReturnsNotDetected()
    {
        var dto = new AppointmentDetectDto
        {
            Transcript = "Bonjour, oui je suis intéressé par vos services"
        };

        var result = await _sut.DetectAppointmentAsync(dto);

        result.Detected.Should().BeFalse();
        result.Confidence.Should().Be(0);
    }

    [Fact]
    public async Task AnonymizeTranscriptAsync_MasksCreditCardAndPhone()
    {
        var dto = new AnonymizeDto
        {
            Transcript = "Ma carte est 1234567890123456 et mon téléphone est 06 12 34 56 78"
        };

        var result = await _sut.AnonymizeTranscriptAsync(dto);

        result.Anonymized.Should().Contain("****-****-****-****");
        result.Anonymized.Should().Contain("** ** ** ** **");
        result.Anonymized.Should().NotContain("1234567890123456");
    }

    [Fact]
    public async Task AnonymizeTranscriptAsync_CleanText_Unchanged()
    {
        var dto = new AnonymizeDto
        {
            Transcript = "Bonjour, je suis intéressé par l'installation de panneaux solaires"
        };

        var result = await _sut.AnonymizeTranscriptAsync(dto);

        result.Anonymized.Should().Be(dto.Transcript);
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_ShortCall_DetectsInactivity()
    {
        var dto = new InactivityRequestDto
        {
            CallDuration = 15,
            Transcription = "Allô ?"
        };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeTrue();
        result.Reason.Should().Contain("Appel anormalement court");
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_LowWordCount_DetectsInactivity()
    {
        var dto = new InactivityRequestDto
        {
            CallDuration = 120,
            Transcription = "oui non"
        };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeTrue();
        result.Reason.Should().Contain("Faible volume de parole");
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_NormalCall_NoInactivity()
    {
        var dto = new InactivityRequestDto
        {
            CallDuration = 120,
            Transcription = string.Join(" ", Enumerable.Range(0, 100).Select(_ => "mot"))
        };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeFalse();
    }

    [Fact]
    public async Task AnalyzeInactivityAsync_NullDuration_NoInactivity()
    {
        var dto = new InactivityRequestDto
        {
            CallDuration = null,
            Transcription = "Test"
        };

        var result = await _sut.AnalyzeInactivityAsync(dto);

        result.InactivityDetected.Should().BeFalse();
    }

    [Fact]
    public async Task GetInsightsAsync_NoData_ReturnsEmptyStats()
    {
        var result = await _sut.GetInsightsAsync(agentId: 9999);

        result.Appointments.Total.Should().Be(0);
        result.CallStats.TotalCalls.Should().Be(0);
        result.Tip.Should().Be("Good performance, keep it up!");
    }

    [Fact]
    public async Task DiarizeTranscriptAsync_Empty_ReturnsNoMethod()
    {
        var dto = new DiarizationRequestDto { Transcript = "" };

        var result = await _sut.DiarizeTranscriptAsync(dto);

        result.Method.Should().Be("none");
        result.AgentText.Should().Be("");
    }

    [Fact]
    public async Task DiarizeTranscriptAsync_AgentLabel_SplitsCorrectly()
    {
        var dto = new DiarizationRequestDto
        {
            Transcript = "Agent: Bonjour, ici Sophie\nClient: Bonjour, je suis intéressé\nAgent: Parfait, je vais vous expliquer"
        };

        var result = await _sut.DiarizeTranscriptAsync(dto, callDuration: 60);

        result.LabeledTranscript.Should().Contain("[Agent]").And.Contain("[Client]");
        result.AgentText.Should().Contain("Bonjour").And.Contain("Parfait");
        result.ClientText.Should().Contain("intéressé");
        result.Method.Should().Be("rule_based");
    }

    [Fact]
    public async Task DiarizeTranscriptAsync_AlternatingNoLabels_AssignsCorrectly()
    {
        var dto = new DiarizationRequestDto
        {
            Transcript = "Bonjour je suis votre conseiller\nBonjour j'ai un projet\nTrès bien je vais vous aider\nMerci beaucoup"
        };

        var result = await _sut.DiarizeTranscriptAsync(dto);

        result.AgentTalkRatio.Should().BeGreaterThan(0);
        result.ClientTalkRatio.Should().BeGreaterThan(0);
        (result.AgentTalkRatio + result.ClientTalkRatio).Should().BeApproximately(1.0f, 0.1f);
    }

    [Fact]
    public async Task DiarizeTranscriptAsync_WithCallDuration_CalculatesSeconds()
    {
        var dto = new DiarizationRequestDto
        {
            Transcript = "Agent: Bonjour\nClient: Bonjour\nAgent: Merci\nClient: Au revoir"
        };

        var result = await _sut.DiarizeTranscriptAsync(dto, callDuration: 120);

        result.AgentSeconds.Should().BeGreaterThan(0);
        result.ClientSeconds.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ExtractPostalCodeAsync_ValidFrenchCode_ExtractsRegion()
    {
        var dto = new PostalCodeExtractRequestDto
        {
            Transcript = "Mon code postal est 75001"
        };

        var result = await _sut.ExtractPostalCodeAsync(dto);

        result.Extracted.Should().BeTrue();
        result.PostalCode.Should().Be("75001");
        result.Region.Should().Be("Île-de-France");
    }

    [Fact]
    public async Task ExtractPostalCodeAsync_NoCode_ReturnsNotExtracted()
    {
        var dto = new PostalCodeExtractRequestDto
        {
            Transcript = "Je n'ai pas de code postal à vous donner"
        };

        var result = await _sut.ExtractPostalCodeAsync(dto);

        result.Extracted.Should().BeFalse();
    }

    [Fact]
    public async Task ExtractPostalCodeAsync_BordeauxCode_ReturnsNouvelleAquitaine()
    {
        var dto = new PostalCodeExtractRequestDto
        {
            Transcript = "J'habite à Bordeaux 33000"
        };

        var result = await _sut.ExtractPostalCodeAsync(dto);

        result.Extracted.Should().BeTrue();
        result.PostalCode.Should().Be("33000");
        result.Region.Should().Be("Nouvelle-Aquitaine");
    }

    [Fact]
    public async Task ExtractPostalCodeAsync_LyonCode_ReturnsAuvergneRhoneAlpes()
    {
        var dto = new PostalCodeExtractRequestDto
        {
            Transcript = "69001 Lyon"
        };

        var result = await _sut.ExtractPostalCodeAsync(dto);

        result.Extracted.Should().BeTrue();
        result.Region.Should().Be("Auvergne-Rhône-Alpes");
    }

    [Fact]
    public async Task ExtractPostalCodeAsync_EmptyTranscript_ReturnsNotExtracted()
    {
        var dto = new PostalCodeExtractRequestDto { Transcript = "" };

        var result = await _sut.ExtractPostalCodeAsync(dto);

        result.Extracted.Should().BeFalse();
    }

    [Fact]
    public async Task SummarizeTranscriptAsync_Empty_ReturnsEmpty()
    {
        var dto = new SummarizeRequestDto { Transcript = "" };

        var result = await _sut.SummarizeTranscriptAsync(dto);

        result.Summary.Should().Be("");
        result.Keywords.Should().Be("");
    }

    [Fact]
    public async Task SummarizeTranscriptAsync_ChatFails_ReturnsFallback()
    {
        _mockChat.Setup(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Ollama down"));

        var dto = new SummarizeRequestDto
        {
            Transcript = "Bonjour je suis intéressé par vos services de panneaux solaires",
            AgentName = "Sophie"
        };

        var result = await _sut.SummarizeTranscriptAsync(dto);

        result.Summary.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task AnalyzeScriptAsync_Empty_ReturnsDefaults()
    {
        var dto = new ScriptAnalysisRequestDto { Transcript = "" };

        var result = await _sut.AnalyzeScriptAsync(dto);

        result.ScriptRespected.Should().BeFalse();
        result.ScorePercentage.Should().Be(0);
    }

    [Fact]
    public async Task AnalyzeScriptAsync_ChatFails_ReturnsFallback()
    {
        _mockChat.Setup(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Ollama down"));

        var dto = new ScriptAnalysisRequestDto
        {
            Transcript = "Appel commercial standard avec client intéressé",
            Qualification = "PV"
        };

        var result = await _sut.AnalyzeScriptAsync(dto);

        result.ScoreEcoute.Should().Be(50);
        result.ScoreAccueil.Should().Be(50);
        result.ScoreConclusion.Should().Be(50);
        result.ScorePercentage.Should().Be(50);
    }
}
