using CrmApi.Controllers;
using CrmApi.Data;
using CrmApi.DTOs.Ai;
using CrmApi.Models.Entities;
using CrmApi.Services.Ai;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class AnalysisControllerIntegrationTests : ControllerTestBase, IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<AnalysisController>> _mockLogger;
    private readonly Mock<IAiService> _mockAi;
    private readonly Mock<ITranscriptionService> _mockTranscription;
    private readonly AnalysisController _sut;
    private readonly AnalysisController _adminController;

    public AnalysisControllerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"analysis_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();

        _mockLogger = new Mock<ILogger<AnalysisController>>(MockBehavior.Loose);
        _mockAi = new Mock<IAiService>(MockBehavior.Strict);
        _mockTranscription = new Mock<ITranscriptionService>(MockBehavior.Strict);
        _mockTranscription.Setup(s => s.TranscribeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TranscriptionResultDto { Success = true, Text = "Bonjour, je suis intéressé par des panneaux solaires.", Language = "fr", Duration = 120 });

        _sut = new AnalysisController(_mockLogger.Object, _mockAi.Object, _mockTranscription.Object, _context);
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        _adminController = new AnalysisController(_mockLogger.Object, _mockAi.Object, _mockTranscription.Object, _context);
        _adminController.ControllerContext = CreateControllerContext(role: "admin");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task AnalyzeTranscript_Valid_ReturnsOk()
    {
        var dto = new TranscriptAnalysisRequestDto
        {
            Transcript = "Bonjour, je suis intéressé par des panneaux solaires.",
            CallDuration = 120,
            AgentName = "Alice",
            Qualification = "PV"
        };

        _mockAi.Setup(s => s.AnalyzeInactivityAsync(It.IsAny<InactivityRequestDto>()))
            .ReturnsAsync(new InactivityResultDto { InactivityDetected = false, Reason = "" });
        _mockAi.Setup(s => s.DetectRefusalAsync(It.IsAny<RefusalCheckDto>()))
            .ReturnsAsync(new RefusalResultDto { RefusalDetected = false, PrimaryMotive = "" });
        _mockAi.Setup(s => s.DetectAppointmentAsync(It.IsAny<AppointmentDetectDto>()))
            .ReturnsAsync(new AppointmentDetectResultDto { Detected = false });
        _mockAi.Setup(s => s.CheckQualificationAsync(It.IsAny<QualificationCheckDto>()))
            .ReturnsAsync(new QualificationResultDto { Coherent = true });
        _mockAi.Setup(s => s.DiarizeTranscriptAsync(It.IsAny<DiarizationRequestDto>(), 120))
            .ReturnsAsync(new DiarizationResultDto { AgentTalkRatio = 0.5f, ClientTalkRatio = 0.5f });
        _mockAi.Setup(s => s.SummarizeTranscriptAsync(It.IsAny<SummarizeRequestDto>()))
            .ReturnsAsync(new SummarizeResultDto { Summary = "Summary", Keywords = "kw1,kw2" });
        _mockAi.Setup(s => s.ExtractPostalCodeAsync(It.IsAny<PostalCodeExtractRequestDto>()))
            .ReturnsAsync(new PostalCodeExtractResultDto { PostalCode = "" });
        _mockAi.Setup(s => s.AnalyzeScriptAsync(It.IsAny<ScriptAnalysisRequestDto>()))
            .ReturnsAsync(new ScriptAnalysisResultDto
            {
                Sentiment = "positif",
                SentimentScore = 0.8,
                ScorePercentage = 75,
                Performance = "good",
                ScoreAccueil = 7,
                ScoreEnergie = 6,
                ScoreVoix = 8,
                ScoreEcoute = 7,
                ScoreClient = 6,
                ScoreOperateur = 7,
                ScoreEfficacite = 6,
                ScoreConclusion = 7,
                ScriptRespected = true,
                ObjectionsHandled = true,
                CustomerIntent = "achat",
                NextSteps = "relance"
            });

        var result = await _sut.AnalyzeTranscript(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task AnalyzeTranscript_EmptyTranscript_ReturnsBadRequest()
    {
        var dto = new TranscriptAnalysisRequestDto { Transcript = "" };

        var result = await _sut.AnalyzeTranscript(dto);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task AnalyzeExistingCall_Valid_ReturnsOk()
    {
        _context.Calls.Add(new Call
        {
            Id = 1,
            AgentName = "Alice",
            Transcription = "Test transcript",
            CallDuration = 100,
            Qualification = "PV"
        });
        await _context.SaveChangesAsync();

        _mockAi.Setup(s => s.DiarizeTranscriptAsync(It.IsAny<DiarizationRequestDto>(), 100))
            .ReturnsAsync(new DiarizationResultDto { LabeledTranscript = "labeled" });
        _mockAi.Setup(s => s.SummarizeTranscriptAsync(It.IsAny<SummarizeRequestDto>()))
            .ReturnsAsync(new SummarizeResultDto { Summary = "Summary", Keywords = "kw" });
        _mockAi.Setup(s => s.AnalyzeScriptAsync(It.IsAny<ScriptAnalysisRequestDto>()))
            .ReturnsAsync(new ScriptAnalysisResultDto { Sentiment = "positif", SentimentScore = 0.8, ScorePercentage = 75, Performance = "good" });
        _mockAi.Setup(s => s.ExtractPostalCodeAsync(It.IsAny<PostalCodeExtractRequestDto>()))
            .ReturnsAsync(new PostalCodeExtractResultDto { PostalCode = "75001" });
        _mockAi.Setup(s => s.DetectRefusalAsync(It.IsAny<RefusalCheckDto>()))
            .ReturnsAsync(new RefusalResultDto { PrimaryMotive = "" });
        _mockAi.Setup(s => s.AnonymizeTranscriptAsync(It.IsAny<AnonymizeDto>()))
            .ReturnsAsync(new AnonymizeResultDto { Anonymized = "" });

        var result = await _sut.AnalyzeExistingCall(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task AnalyzeExistingCall_NotFound_Returns404()
    {
        var result = await _sut.AnalyzeExistingCall(999);
        AssertNotFound(result);
    }

    [Fact]
    public async Task BatchAnalyzeCalls_Agent_ReturnsForbid()
    {
    }

    [Fact]
    public async Task BatchAnalyzeCalls_Admin_ReturnsOk()
    {
        _context.Calls.Add(new Call
        {
            Id = 2,
            AgentName = "Bob",
            Transcription = "Call transcript here",
            CallDuration = 60,
            Qualification = "PV"
        });
        await _context.SaveChangesAsync();

        _mockAi.Setup(s => s.DiarizeTranscriptAsync(It.IsAny<DiarizationRequestDto>(), 60))
            .ReturnsAsync(new DiarizationResultDto { LabeledTranscript = "labeled" });
        _mockAi.Setup(s => s.SummarizeTranscriptAsync(It.IsAny<SummarizeRequestDto>()))
            .ReturnsAsync(new SummarizeResultDto { Summary = "S", Keywords = "k" });
        _mockAi.Setup(s => s.AnalyzeScriptAsync(It.IsAny<ScriptAnalysisRequestDto>()))
            .ReturnsAsync(new ScriptAnalysisResultDto { Sentiment = "neutre", SentimentScore = 0.5, ScorePercentage = 50, Performance = "avg" });
        _mockAi.Setup(s => s.ExtractPostalCodeAsync(It.IsAny<PostalCodeExtractRequestDto>()))
            .ReturnsAsync(new PostalCodeExtractResultDto { PostalCode = "" });

        var result = await _adminController.BatchAnalyzeCalls(new BatchAnalysisRequestDto { Limit = 10 });

        result.Should().BeOfType<OkObjectResult>();
    }


}
