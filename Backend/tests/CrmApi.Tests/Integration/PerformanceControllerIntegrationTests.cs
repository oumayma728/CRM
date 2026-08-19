using CrmApi.Controllers;
using CrmApi.Data;
using CrmApi.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class PerformanceControllerIntegrationTests : ControllerTestBase, IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly PerformanceController _authController;
    private readonly PerformanceController _anonController;

    public PerformanceControllerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"perf_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        _context.Calls.Add(new Call { Id = 1, AgentName = "Alice", AgentId = "1", CallDate = monthStart.AddDays(1), CallDuration = 120, ScorePercentage = 80, Sentiment = "POSITIVE", Qualification = "RDV" });
        _context.Calls.Add(new Call { Id = 2, AgentName = "Alice", AgentId = "1", CallDate = monthStart.AddDays(2), CallDuration = 90, ScorePercentage = 70, Sentiment = "NEGATIVE" });
        _context.Users.Add(new User { Id = 1, Name = "Alice", Username = "alice", Role = UserRole.Agent, Password = "hash", Email = "a@test.com", CreatedAt = DateTime.UtcNow });
        _context.SaveChanges();

        _authController = new PerformanceController(_context);
        _authController.ControllerContext = CreateControllerContext(role: "admin");

        _anonController = new PerformanceController(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetComparison_ReturnsOk()
    {
        var result = await _authController.GetComparison(null, null, null);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetComparison_WithAgentName_ReturnsOk()
    {
        var result = await _authController.GetComparison(null, null, "Alice");
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAgents_ReturnsOk()
    {
        var result = await _authController.GetAgents(null);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAgentsFromCalls_ReturnsOk()
    {
        var result = await _anonController.GetAgentsFromCalls();
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAgentPerformance_Existing_ReturnsOk()
    {
        var result = await _authController.GetAgentPerformance(1);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAgentPerformance_NonExistent_ReturnsNotFound()
    {
        var result = await _authController.GetAgentPerformance(999);
        Assert.IsType<NotFoundObjectResult>(result);
    }
}
