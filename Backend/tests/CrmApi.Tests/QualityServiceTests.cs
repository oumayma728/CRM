using CrmApi.Data;
using CrmApi.DTOs.Quality;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Quality;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class QualityServiceTests
{
    private readonly QualityService _sut;
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public QualityServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_quality_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockUow = new Mock<IUnitOfWork>();
        _sut = new QualityService(_context, _mockUow.Object);
    }

    [Fact]
    public async Task CreateEvaluationAsync_ValidDto_ReturnsTrue()
    {
        var dto = new CreateEvaluationDto
        {
            AgentId = 1,
            CallRef = "CALL-001",
            GlobalScore = 85,
            Decision = "approved",
            Commentaires = "Excellent travail",
            Scores = new Dictionary<string, int> { { "ecoute", 8 }, { "persuasion", 9 } }
        };

        var result = await _sut.CreateEvaluationAsync(evaluatorId: 2, dto);

        result.Should().BeTrue();
        var saved = await _context.ManualEvaluations.FirstOrDefaultAsync();
        saved.Should().NotBeNull();
        saved!.GlobalScore.Should().Be(85);
        saved.AgentId.Should().Be(1);
        saved.EvaluatorId.Should().Be(2);
        saved.CallRef.Should().Be("CALL-001");
    }

    [Fact]
    public async Task GetAllEvaluationsAsync_ReturnsAllEvaluations()
    {
        var users = new List<User>
        {
            new() { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Username = "eval1", Name = "Eval 1", Role = UserRole.Qualite, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow }
        };
        _context.Users.AddRange(users);

        var evals = new List<ManualEvaluation>
        {
            new() { AgentId = 1, EvaluatorId = 2, GlobalScore = 80, CallRef = "C1" },
            new() { AgentId = 1, EvaluatorId = 2, GlobalScore = 90, CallRef = "C2" }
        };
        _context.ManualEvaluations.AddRange(evals);
        await _context.SaveChangesAsync();

        foreach (var e in evals)
        {
            _context.Entry(e).Reference(x => x.Agent).IsLoaded = true;
            _context.Entry(e).Reference(x => x.Evaluator).IsLoaded = true;
            e.Agent = users[0];
            e.Evaluator = users[1];
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetAllEvaluationsAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAgentEvaluationsAsync_ReturnsFiltered()
    {
        var users = new List<User>
        {
            new() { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Username = "agent2", Name = "Agent 2", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 3, Username = "eval1", Name = "Eval 1", Role = UserRole.Qualite, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow }
        };
        _context.Users.AddRange(users);

        var evals = new List<ManualEvaluation>
        {
            new() { AgentId = 1, EvaluatorId = 3, GlobalScore = 80, CallRef = "C1" },
            new() { AgentId = 2, EvaluatorId = 3, GlobalScore = 90, CallRef = "C2" }
        };
        _context.ManualEvaluations.AddRange(evals);
        await _context.SaveChangesAsync();

        foreach (var e in evals)
        {
            _context.Entry(e).Reference(x => x.Agent).IsLoaded = true;
            _context.Entry(e).Reference(x => x.Evaluator).IsLoaded = true;
            e.Agent = users.First(u => u.Id == e.AgentId);
            e.Evaluator = users.First(u => u.Id == e.EvaluatorId);
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetAgentEvaluationsAsync(agentId: 1);

        result.Should().HaveCount(1);
        result[0].GlobalScore.Should().Be(80);
    }

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectStats()
    {
        _context.ManualEvaluations.AddRange(
            new ManualEvaluation { AgentId = 1, EvaluatorId = 2, GlobalScore = 80, Decision = "approved" },
            new ManualEvaluation { AgentId = 1, EvaluatorId = 2, GlobalScore = 60, Decision = "needs_improvement" },
            new ManualEvaluation { AgentId = 1, EvaluatorId = 2, GlobalScore = 70, Decision = "approved" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetStatsAsync();

        result.Total.Should().Be(3);
        result.AvgScore.Should().Be(70);
        result.ByDecision.Should().ContainKey("approved").WhoseValue.Should().Be(2);
        result.ByDecision.Should().ContainKey("needs_improvement").WhoseValue.Should().Be(1);
    }

    [Fact]
    public async Task GetStatsAsync_NoData_ReturnsZeros()
    {
        var result = await _sut.GetStatsAsync();

        result.Total.Should().Be(0);
        result.AvgScore.Should().Be(0);
        result.ByDecision.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteEvaluationAsync_Existing_ReturnsTrue()
    {
        var eval = new ManualEvaluation { AgentId = 1, EvaluatorId = 2, GlobalScore = 75 };
        _context.ManualEvaluations.Add(eval);
        await _context.SaveChangesAsync();

        var result = await _sut.DeleteEvaluationAsync(eval.Id);

        result.Should().BeTrue();
        var deleted = await _context.ManualEvaluations.FindAsync(eval.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteEvaluationAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.DeleteEvaluationAsync(999);
        result.Should().BeFalse();
    }
}
