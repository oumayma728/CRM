using Backend.Data;
using Backend.DTOs.Calls;
using Backend.Entities;
using Backend.Services.Ai;
using Backend.Services.Attendance;
using Backend.Services.Calls;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;
using Backend.DTOs.Ai;

namespace CRM.API.Tests;

public class CallServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IAiService> _mockAi;
    private readonly Mock<IAttendanceService> _mockAttendance;
    private readonly CallService _sut;

    public CallServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_call_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _mockAi = new Mock<IAiService>();
        _mockAttendance = new Mock<IAttendanceService>();
        _sut = new CallService(_context, _mockAi.Object, _mockAttendance.Object);
    }

    [Fact]
    public async Task GetCallsAsync_AdminRole_ReturnsAll()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "Agent A", CallDate = DateTime.UtcNow, ScorePercentage = 80, Sentiment = "POSITIVE" },
            new Call { AgentName = "Agent B", CallDate = DateTime.UtcNow, ScorePercentage = 70, Sentiment = "NEUTRAL" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallsAsync(0, "admin", null, null, 10, 0);

        result.Total.Should().Be(2);
        result.Calls.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetCallsAsync_AgentRole_FiltersByAgentName()
    {
        var user = new Agent { Id = 1, Prenom = "Agent", Nom = "A", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(user);
        _context.Calls.AddRange(
            new Call { AgentName = "Agent A", CallDate = DateTime.UtcNow, ScorePercentage = 80 },
            new Call { AgentName = "Agent B", CallDate = DateTime.UtcNow, ScorePercentage = 70 }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallsAsync(1, "agent", null, null, 10, 0);

        result.Total.Should().Be(1);
        result.Calls[0].AgentName.Should().Be("Agent A");
    }

    [Fact]
    public async Task GetCallsAsync_FilterBySentiment_ReturnsFiltered()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "A", CallDate = DateTime.UtcNow, Sentiment = "POSITIVE", ScorePercentage = 80 },
            new Call { AgentName = "B", CallDate = DateTime.UtcNow, Sentiment = "NEGATIVE", ScorePercentage = 40 }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallsAsync(0, "admin", null, "POSITIVE", 10, 0);

        result.Total.Should().Be(1);
        result.Calls[0].Sentiment.Should().Be("POSITIVE");
    }

    [Fact]
    public async Task GetCallByIdAsync_ExistingAdmin_ReturnsCall()
    {
        var call = new Call { AgentName = "Agent A", CallDate = DateTime.UtcNow, ScorePercentage = 85 };
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallByIdAsync(call.Id, 0, "admin");

        result.Should().NotBeNull();
        result!.ScorePercentage.Should().Be(85);
    }

    [Fact]
    public async Task GetCallByIdAsync_NonExistent_ReturnsNull()
    {
        var result = await _sut.GetCallByIdAsync(999, 0, "admin");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCallByIdAsync_AgentNotOwnCall_ReturnsNull()
    {
        var user = new Agent { Id = 1, Prenom = "Agent", Nom = "A", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(user);
        var call = new Call { AgentName = "Agent B", CallDate = DateTime.UtcNow, ScorePercentage = 80 };
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallByIdAsync(call.Id, 1, "agent");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCallStatsAsync_Admin_ReturnsCorrectStats()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "A", ScorePercentage = 80, Sentiment = "POSITIVE", Performance = "good" },
            new Call { AgentName = "B", ScorePercentage = 60, Sentiment = "NEUTRAL", Performance = "average" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallStatsAsync(0, "admin", null);

        result.TotalCalls.Should().Be(2);
        result.AvgScore.Should().Be(70);
        result.SentimentDistribution.Should().ContainKey("POSITIVE").WhoseValue.Should().Be(1);
        result.SentimentDistribution.Should().ContainKey("NEUTRAL").WhoseValue.Should().Be(1);
    }

    [Fact]
    public async Task GetAgentsSummaryAsync_GroupsByAgent()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "A", ScorePercentage = 90, Sentiment = "POSITIVE" },
            new Call { AgentName = "A", ScorePercentage = 70, Sentiment = "NEUTRAL" },
            new Call { AgentName = "B", ScorePercentage = 50, Sentiment = "NEGATIVE" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentsSummaryAsync();

        result.Should().HaveCount(2);
        var agentA = result.First(r => r.AgentName == "A");
        agentA.TotalCalls.Should().Be(2);
        agentA.AvgScore.Should().Be(80);
        agentA.PositiveCalls.Should().Be(1);
    }

    [Fact]
    public async Task SaveCallAsync_WithAnonymization_SavesCall()
    {
        var user = new Agent { Id = 1, Prenom = "Agent", Nom = "A", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        _mockAi.Setup(a => a.AnonymizeTranscriptAsync(It.IsAny<AnonymizeDto>()))
            .ReturnsAsync(new Backend.DTOs.Ai.AnonymizeResultDto { Anonymized = "[ANONYMIZED] notes" });

        var (success, callId, message) = await _sut.SaveCallAsync(1, new CallSaveDto
        {
            Besoin = "info",
            Budget = "5000",
            Interet = "high",
            Statut = "followup",
            Notes = "Sensitive data here"
        });

        success.Should().BeTrue();
        callId.Should().BeGreaterThan(0);
        (await _context.Calls.FindAsync(callId)).Should().NotBeNull();
        message.Should().Contain("RGPD");
    }

    [Fact]
    public async Task SaveCallAsync_WithoutNotes_StillSaves()
    {
        var user = new Agent { Id = 1, Prenom = "Agent", Nom = "A", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var (success, callId, _) = await _sut.SaveCallAsync(1, new CallSaveDto
        {
            Besoin = "info",
            Statut = "new"
        });

        success.Should().BeTrue();
        callId.Should().BeGreaterThan(0);
        (await _context.Calls.FindAsync(callId)).Should().NotBeNull();
    }
}
