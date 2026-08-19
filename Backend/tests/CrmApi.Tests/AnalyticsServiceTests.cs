using CrmApi.Data;
using CrmApi.DTOs.Analytics;
using CrmApi.Models.Entities;
using CrmApi.Services.Analytics;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CrmApi.Tests;

public class AnalyticsServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly AnalyticsService _sut;

    public AnalyticsServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_analytics_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _sut = new AnalyticsService(_context);
    }

    [Fact]
    public async Task GetOverviewAsync_WithCalls_ReturnsOverview()
    {
        var agentName = "Agent Test";
        _context.Calls.AddRange(
            new Call { AgentName = agentName, CallDate = DateTime.UtcNow, ScorePercentage = 80f, Sentiment = "POSITIVE", Performance = "good", ScoreAccueil = 8, ScoreEnergie = 7, ScoreVoix = 9, ScoreEcoute = 8, ScoreClient = 7, ScoreOperateur = 8, ScoreEfficacite = 7, ScoreConclusion = 8, AgentTalkRatio = 0.6f, ClientTalkRatio = 0.4f, CallDuration = 120 },
            new Call { AgentName = agentName, CallDate = DateTime.UtcNow.AddHours(-2), ScorePercentage = 60f, Sentiment = "NEUTRAL", Performance = "average", ScoreAccueil = 6, ScoreEnergie = 5, ScoreVoix = 7, ScoreEcoute = 6, ScoreClient = 5, ScoreOperateur = 6, ScoreEfficacite = 5, ScoreConclusion = 6, AgentTalkRatio = 0.5f, ClientTalkRatio = 0.5f, CallDuration = 90 }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync();

        result.TotalCalls.Should().Be(2);
        result.AvgScore.Should().Be(70);
        result.Sentiments.Should().ContainKey("POSITIVE");
        result.BestAgent.Should().Be(agentName);
        result.Hourly.Should().NotBeEmpty();
        result.Radar.Should().HaveCount(8);
    }

    [Fact]
    public async Task GetOverviewAsync_NoCalls_ReturnsDefaults()
    {
        var result = await _sut.GetOverviewAsync();

        result.TotalCalls.Should().Be(0);
        result.AvgScore.Should().Be(0);
        result.BestAgent.Should().BeNull();
        result.AvgDuration.Should().Be(0);
    }

    [Fact]
    public async Task GetOverviewAsync_WithFollowups_IncludesPendingCount()
    {
        _context.Followups.Add(new Followup { AgentName = "A1", Status = "a_relancer", AppointmentDate = DateTime.UtcNow.AddDays(-1), RelanceCount = 0, UpdatedAt = DateTime.UtcNow.AddDays(-1) });
        await _context.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync();

        result.PendingFollowups.Should().Be(1);
    }

    [Fact]
    public async Task GetAgentsPerformanceAsync_ReturnsGroupedPerformance()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "Alice", CallDate = DateTime.UtcNow, ScorePercentage = 90f, Sentiment = "POSITIVE", AgentTalkRatio = 0.6f, ClientTalkRatio = 0.4f },
            new Call { AgentName = "Alice", CallDate = DateTime.UtcNow.AddDays(-1), ScorePercentage = 70f, Sentiment = "NEUTRAL", AgentTalkRatio = 0.5f, ClientTalkRatio = 0.5f },
            new Call { AgentName = "Bob", CallDate = DateTime.UtcNow, ScorePercentage = 50f, Sentiment = "NEGATIVE", AgentTalkRatio = 0.7f, ClientTalkRatio = 0.3f }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentsPerformanceAsync();

        result.Should().HaveCount(2);
        var alice = result.Should().ContainSingle(a => a.AgentName == "Alice").Subject;
        alice.TotalCalls.Should().Be(2);
        alice.AvgScore.Should().Be(80);
        alice.Positive.Should().Be(1);
        alice.Negative.Should().Be(0);
    }

    [Fact]
    public async Task GetSupervisionAsync_ReturnsRefusalAndCoherenceData()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "A1", RefusalReason = "Prix trop élevé", QualificationMatch = false, CoherenceScore = 8f, InactivityDetected = false },
            new Call { AgentName = "A1", RefusalReason = "Prix trop élevé", QualificationMatch = true, CoherenceScore = 9f, InactivityDetected = true },
            new Call { AgentName = "A2", RefusalReason = "Pas intéressé", QualificationMatch = false, CoherenceScore = 5f, InactivityDetected = false }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetSupervisionAsync();

        result.Refusals.Should().HaveCount(2);
        result.IncoherenceCount.Should().Be(2);
        result.InactivityCount.Should().Be(1);
        result.CoherenceAvg.Should().Be(7.33);
    }

    [Fact]
    public async Task GetSupervisionAsync_NoCalls_ReturnsDefaults()
    {
        var result = await _sut.GetSupervisionAsync();

        result.Refusals.Should().BeEmpty();
        result.IncoherenceCount.Should().Be(0);
        result.CoherenceAvg.Should().Be(0);
    }

    [Fact]
    public async Task GetGeoAsync_WithPostalCodes_ReturnsDepartments()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "A", PostalCode = "75001", CallDate = DateTime.UtcNow, ScorePercentage = 80f },
            new Call { AgentName = "A", PostalCode = "75002", CallDate = DateTime.UtcNow, ScorePercentage = 60f },
            new Call { AgentName = "A", PostalCode = "13001", CallDate = DateTime.UtcNow, ScorePercentage = 90f }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetGeoAsync();

        result.TotalLocalized.Should().Be(3);
        result.DeptCount.Should().Be(2);
        result.Departments.Should().Contain(d => d.Dept == "75");
        result.Departments.Should().Contain(d => d.Dept == "13");
    }

    [Fact]
    public async Task GetFollowupsAsync_ReturnsStats()
    {
        _context.Followups.AddRange(
            new Followup { AgentName = "A1", Status = "a_relancer", AppointmentDate = DateTime.UtcNow.AddDays(-3), RelanceCount = 0, UpdatedAt = DateTime.UtcNow.AddDays(-3) },
            new Followup { AgentName = "A1", Status = "converti", AppointmentDate = DateTime.UtcNow.AddDays(-5), RelanceCount = 1, UpdatedAt = DateTime.UtcNow.AddDays(-5) },
            new Followup { AgentName = "A2", Status = "relance_en_cours", AppointmentDate = DateTime.UtcNow.AddDays(-2), RelanceCount = 0, UpdatedAt = DateTime.UtcNow.AddDays(-2) }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetFollowupsAsync();

        result.Stats.Total.Should().Be(3);
        result.Stats.ARelancer.Should().Be(1);
        result.Stats.Convertis.Should().Be(1);
        result.Stats.TauxConversion.Should().BeApproximately(33.33, 0.01);
        result.ByStatus.Should().HaveCount(3);
        result.ByAgent.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetCallsLogAsync_ReturnsOrderedAndLimited()
    {
        for (int i = 0; i < 5; i++)
        {
            _context.Calls.Add(new Call { AgentName = "A1", CallDate = DateTime.UtcNow.AddHours(-i), ScorePercentage = 70f + i, CallDuration = 100 + i });
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallsLogAsync(limit: 3);

        result.Should().HaveCount(3);
        result.Should().BeInDescendingOrder(x => x.CallDate);
    }

    [Fact]
    public async Task GetCallsLogAsync_FilterByAgent_ReturnsFiltered()
    {
        _context.Calls.AddRange(
            new Call { AgentName = "Alice", CallDate = DateTime.UtcNow, ScorePercentage = 80f },
            new Call { AgentName = "Bob", CallDate = DateTime.UtcNow, ScorePercentage = 70f }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCallsLogAsync(limit: 10, agentName: "Alice");

        result.Should().HaveCount(1);
        result[0].AgentName.Should().Be("Alice");
    }

    [Fact]
    public async Task GetPointageAsync_ReturnsTodaysPointage()
    {
        var user = new User { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(user);
        _context.Attendances.Add(new Attendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-4), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-4) });
        _context.Calls.Add(new Call { AgentName = "Agent 1", CallDate = DateTime.UtcNow.AddHours(-3), ScorePercentage = 80 });
        await _context.SaveChangesAsync();

        var result = await _sut.GetPointageAsync();

        result.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetComparisonAsync_ReturnsDayWeekMonthComparison()
    {
        _context.Calls.Add(            new Call { AgentName = "A1", CallDate = DateTime.UtcNow, ScorePercentage = 80f });
        await _context.SaveChangesAsync();

        var result = await _sut.GetComparisonAsync();

        result.Day.Should().NotBeNull();
        result.Week.Should().NotBeNull();
        result.Month.Should().NotBeNull();
        result.Day.Total.Should().Be(1);
    }

    [Fact]
    public async Task GetLiveAgentsAsync_ReturnsOnlineAgents()
    {
        var user = new User { Id = 1, Username = "live1", Name = "Live Agent", Role = UserRole.Agent, Password = "hash", Email = "l@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(user);
        _context.Attendances.Add(new Attendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-2), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-2) });
        _context.Calls.Add(            new Call { AgentName = "Live Agent", CallDate = DateTime.UtcNow.AddHours(-1), ScorePercentage = 85f });
        await _context.SaveChangesAsync();

        var result = await _sut.GetLiveAgentsAsync();

        result.Should().ContainSingle();
    }
}
