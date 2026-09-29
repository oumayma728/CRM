using Backend.Data;
using Backend.DTOs.Quality;
using Backend.Entities;
using Backend.Services.Quality;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CRM.API.Tests;

public class QualityDashboardServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly QualityDashboardService _sut;

    public QualityDashboardServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_qdash_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _sut = new QualityDashboardService(_context);
    }

    [Fact]
    public async Task GetTeamStatusAsync_WithOnlineAgents_ReturnsCorrectCounts()
    {
        var agent1 = new Agent { Id = 1, Prenom = "Agent", Nom = "1", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        var agent2 = new Agent { Id = 2, Prenom = "Agent", Nom = "2", Email = "b@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.AddRange(agent1, agent2);
        _context.AdvancedAttendances.AddRange(
            new AdvancedAttendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-2), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-2) },
            new AdvancedAttendance { UserId = 2, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-3), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-3) }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamStatusAsync();

        result.OnlineCount.Should().Be(2);
        result.OfflineCount.Should().Be(0);
        result.TotalAgents.Should().Be(2);
        result.Members.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetTeamStatusAsync_WithOfflineAgents_ReturnsOffline()
    {
        var agent = new Agent { Id = 1, Prenom = "Offline", Nom = "", Email = "o@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent);
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamStatusAsync();

        result.OnlineCount.Should().Be(0);
        result.OfflineCount.Should().Be(1);
        result.Members.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTeamStatusAsync_WithBreakAgents_ReturnsBreakCount()
    {
        var agent = new Agent { Id = 1, Prenom = "Break", Nom = "Agent", Email = "br@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent);
        var att = new AdvancedAttendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-4), Status = "break", CreatedAt = DateTime.UtcNow.AddHours(-4) };
        _context.AdvancedAttendances.Add(att);
        _context.AttendanceBreaks.Add(new AttendanceBreak { AttendanceId = 1, Type = "dejeuner", StartTime = DateTime.UtcNow.AddMinutes(-30), EndTime = null, DurationMinutes = 0 });
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamStatusAsync();

        result.BreakCount.Should().Be(1);
        result.OnlineCount.Should().Be(0);
        result.Members.Should().ContainSingle(m => m.Status == "break" && m.BreakType == "dejeuner");
    }

    [Fact]
    public async Task GetGlobalStatsAsync_ReturnsStats()
    {
        var agent = new Agent { Id = 1, Prenom = "Stats", Nom = "Agent", Email = "s@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent);
        _context.Calls.AddRange(
            new Call { AgentName = "Stats Agent", CallDate = DateTime.UtcNow, ScorePercentage = 85 },
            new Call { AgentName = "Stats Agent", CallDate = DateTime.UtcNow.AddDays(-1), ScorePercentage = 65 }
        );
        _context.AdvancedAttendances.Add(new AdvancedAttendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-1), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-1) });
        _context.CrmAppointments.Add(new CrmAppointment { AgentId = 1, AppointmentDate = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var result = await _sut.GetGlobalStatsAsync();

        result.TotalAgents.Should().Be(1);
        result.PresentToday.Should().Be(1);
        result.TotalRdvToday.Should().Be(1);
        result.TotalCallsAnalyzed.Should().Be(1);
        result.ComplianceRate.Should().Be(50);
        result.WeeklyTrends.Should().HaveCount(7);
    }

    [Fact]
    public async Task GetAgentsStateAsync_ReturnsAllAgentsWithState()
    {
        var agent1 = new Agent { Id = 1, Prenom = "State", Nom = "1", Email = "st1@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent1);
        _context.AdvancedAttendances.Add(new AdvancedAttendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-5), Status = "active", CreatedAt = DateTime.UtcNow.AddHours(-5) });
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentsStateAsync();

        result.Should().ContainSingle(a => a.Name == "State 1");
        result[0].Status.Should().Be("active");
        result[0].HoursWorked.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetAgentsStateAsync_WithCompletedShift_ShowsOffline()
    {
        var agent = new Agent { Id = 1, Prenom = "Done", Nom = "Agent", Email = "d@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent);
        _context.AdvancedAttendances.Add(new AdvancedAttendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.AddHours(-8), ClockOut = DateTime.UtcNow.AddHours(-1), Status = "completed", CreatedAt = DateTime.UtcNow.AddHours(-8) });
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentsStateAsync();

        var row = result.Should().ContainSingle(a => a.Name == "Done Agent").Subject;
        row.Status.Should().Be("offline");
        row.ClockIn.Should().BeNull();
    }

    [Fact]
    public async Task GetRdvJourAsync_ReturnsDailyAppointments()
    {
        var agent1 = new Agent { Id = 1, Prenom = "Rdv", Nom = "Agent 1", Email = "r1@b.com", MotDePasse = "hash", Role = "AGENT" };
        var agent2 = new Agent { Id = 2, Prenom = "Rdv", Nom = "Agent 2", Email = "r2@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.AddRange(agent1, agent2);
        _context.CrmAppointments.AddRange(
            new CrmAppointment { AgentId = 1, AppointmentDate = DateTime.UtcNow },
            new CrmAppointment { AgentId = 1, AppointmentDate = DateTime.UtcNow },
            new CrmAppointment { AgentId = 2, AppointmentDate = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetRdvJourAsync();

        result.TotalToday.Should().Be(3);
        result.Objectif.Should().Be(30);
        result.ByAgent.Should().HaveCount(2);
        result.ByAgent.First(a => a.Name == "Rdv Agent 1").RdvCount.Should().Be(2);
    }

    [Fact]
    public async Task GetAgentDetailAsync_ExistingAgent_ReturnsDetail()
    {
        var agent = new Agent { Id = 1, Prenom = "Detail", Nom = "Agent", Email = "det@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Users.Add(agent);
        _context.Calls.AddRange(
            new Call { AgentName = "Detail Agent", CallDate = DateTime.UtcNow, ScorePercentage = 80, Qualification = "RDV" },
            new Call { AgentName = "Detail Agent", CallDate = DateTime.UtcNow.AddDays(-5), ScorePercentage = 70, Qualification = "REFUS" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentDetailAsync(1);

        result.Name.Should().Be("Detail Agent");
        result.TotalCalls.Should().Be(2);
        result.AvgQualityScore.Should().Be(75);
        result.QualificationDistribution.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetAgentDetailAsync_NonExistentAgent_ThrowsKeyNotFound()
    {
        await FluentActions.Invoking(() => _sut.GetAgentDetailAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task GetEvaluationHistoryAsync_ReturnsPaged()
    {
        var agent = new Agent { Id = 1, Prenom = "Agent", Nom = "", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        var evaluator = new Qualite { Id = 2, Prenom = "Evaluator", Nom = "", Email = "e@b.com", MotDePasse = "hash", Role = "QUALITE" };
        _context.Users.AddRange(agent, evaluator);
        for (int i = 0; i < 5; i++)
        {
            _context.ManualEvaluations.Add(new ManualEvaluation { AgentId = 1, EvaluatorId = 2, GlobalScore = 70 + i, CallRef = $"C{i}" });
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetEvaluationHistoryAsync(limit: 3, offset: 1);

        result.Should().HaveCount(3);
    }
}
