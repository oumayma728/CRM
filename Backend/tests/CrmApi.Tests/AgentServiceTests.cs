using System.Text.Json;
using CrmApi.Data;
using CrmApi.DTOs.Agent;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Agent;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AgentServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly AgentServiceImpl _sut;

    public AgentServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_agent_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _mockUow = new Mock<IUnitOfWork>();
        _sut = new AgentServiceImpl(_context, _mockUow.Object);
    }

    [Fact]
    public async Task GetAgentsAsync_ReturnsOnlyAgents()
    {
        var agents = new List<User>
        {
            new() { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Username = "qualite", Name = "Qualite", Role = UserRole.Qualite, Password = "hash", Email = "s@b.com", CreatedAt = DateTime.UtcNow }
        };
        _mockUow.Setup(u => u.Users.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync((System.Linq.Expressions.Expression<Func<User, bool>> predicate) => agents.Where(predicate.Compile()).ToList());

        var result = await _sut.GetAgentsAsync();

        result.Should().HaveCount(1);
        result[0].AgentName.Should().Be("Agent 1");
    }

    [Fact]
    public async Task GetAgentsAsync_NoAgents_ReturnsEmpty()
    {
        _mockUow.Setup(u => u.Users.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(new List<User>());

        var result = await _sut.GetAgentsAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAgentPerformanceAsync_ExistingAgent_ReturnsPerformance()
    {
        var user = new User { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(user);
        _context.Calls.Add(new Call { AgentName = "Agent 1", ScorePercentage = 80, CallDuration = 120, CallDate = DateTime.UtcNow.Date, Sentiment = "POSITIVE" });
        _context.CrmAppointments.Add(new CrmAppointment { AgentId = 1, AppointmentDate = DateTime.UtcNow.Date, ClientName = "Client" });
        _context.Attendances.Add(new Attendance { UserId = 1, Date = DateTime.UtcNow.Date, ClockIn = DateTime.UtcNow.Date });
        await _context.SaveChangesAsync();

        _mockUow.Setup(u => u.Users.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync((System.Linq.Expressions.Expression<Func<User, bool>> predicate) => user);

        var result = await _sut.GetAgentPerformanceAsync("1");

        result.AgentId.Should().Be(1);
        result.AgentName.Should().Be("Agent 1");
        result.CurrentMonth.Calls.Should().Be(1);
        result.CurrentMonth.QualityScore.Should().Be(80);
    }

    [Fact]
    public async Task GetAgentPerformanceAsync_NonExistentAgent_ThrowsKeyNotFound()
    {
        _mockUow.Setup(u => u.Users.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        await _sut.Invoking(s => s.GetAgentPerformanceAsync("999")).Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task SaveAgentDataAsync_NewData_CreatesAndReturnsSuccess()
    {
        var dto = new AgentSaveDto { Notes = "Test notes", CallsCount = 10 };

        var (success, message, agentId) = await _sut.SaveAgentDataAsync(1, dto);

        success.Should().BeTrue();
        message.Should().Be("Data saved");
        agentId.Should().Be(1);
        var saved = await _context.AgentSavedData.FirstOrDefaultAsync();
        saved.Should().NotBeNull();
        saved!.AgentId.Should().Be(1);
    }

    [Fact]
    public async Task SaveAgentDataAsync_ExistingData_UpdatesPayload()
    {
        var existing = new AgentSavedData { AgentId = 1, DataType = "session", Payload = "{}" };
        _context.AgentSavedData.Add(existing);
        await _context.SaveChangesAsync();

        var dto = new AgentSaveDto { Notes = "Updated", CallsCount = 20 };
        var (success, _, _) = await _sut.SaveAgentDataAsync(1, dto);

        success.Should().BeTrue();
        var updated = await _context.AgentSavedData.FirstAsync();
        updated.Payload.Should().Contain("Updated");
    }

    [Fact]
    public async Task GetSavedDataAsync_ExistingData_ReturnsDeserializedDto()
    {
        var dto = new AgentSaveDto { Notes = "Saved notes", CallsCount = 15 };
        var payload = JsonSerializer.Serialize(dto);
        _context.AgentSavedData.Add(new AgentSavedData { AgentId = 1, DataType = "session", Payload = payload });
        await _context.SaveChangesAsync();

        var result = await _sut.GetSavedDataAsync(1);

        result.Notes.Should().Be("Saved notes");
        result.CallsCount.Should().Be(15);
    }

    [Fact]
    public async Task GetSavedDataAsync_NoData_ReturnsEmptyDto()
    {
        var result = await _sut.GetSavedDataAsync(1);

        result.Notes.Should().BeNull();
        result.CallsCount.Should().BeNull();
    }
}
