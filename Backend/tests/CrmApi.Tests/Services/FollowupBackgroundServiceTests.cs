using CrmApi.Data;
using CrmApi.Models.Entities;
using CrmApi.Services.Followup;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace CrmApi.Tests.Services;

public class FollowupBackgroundServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Mock<ILogger<FollowupBackgroundService>> _mockLogger;
    private readonly FollowupBackgroundService _sut;

    public FollowupBackgroundServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_followup_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockLogger = new Mock<ILogger<FollowupBackgroundService>>();

        var services = new ServiceCollection();
        services.AddSingleton(_context);
        var serviceProvider = services.BuildServiceProvider();

        _sut = new FollowupBackgroundService(serviceProvider, _mockLogger.Object);
    }

    private async Task SeedFollowupsAsync()
    {
        _context.Followups.AddRange(
            new Followup { AgentName = "Agent1", AppointmentDate = DateTime.UtcNow.AddDays(-5), Status = "a_relancer", RelanceCount = 0, UpdatedAt = DateTime.UtcNow.AddDays(-5) },
            new Followup { AgentName = "Agent1", AppointmentDate = DateTime.UtcNow.AddDays(-10), Status = "a_relancer", RelanceCount = 2, UpdatedAt = DateTime.UtcNow.AddDays(-10) },
            new Followup { AgentName = "Agent2", AppointmentDate = DateTime.UtcNow.AddDays(-3), Status = "a_relancer", RelanceCount = 1, UpdatedAt = DateTime.UtcNow.AddDays(-3) },
            new Followup { AgentName = "Agent2", AppointmentDate = DateTime.UtcNow.AddDays(-1), Status = "a_relancer", RelanceCount = 0, UpdatedAt = DateTime.UtcNow.AddDays(-1) },
            new Followup { AgentName = "Agent3", AppointmentDate = DateTime.UtcNow.AddDays(5), Status = "a_relancer", RelanceCount = 0, UpdatedAt = DateTime.UtcNow } // future
        );
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task ExecuteAsync_WithPendingFollowups_ProcessesThem()
    {
        await SeedFollowupsAsync();

        var cts = new CancellationTokenSource();
        var task = _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        var processed = await _context.Followups.Where(f => f.Status != "a_relancer").ToListAsync();
        processed.Should().HaveCount(4);
        processed.Count(f => f.Status == "perdu").Should().Be(1);
        processed.Count(f => f.Status == "relance_en_cours").Should().Be(3);
    }

    [Fact]
    public async Task ExecuteAsync_NoPendingFollowups_DoesNothing()
    {
        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        var all = await _context.Followups.ToListAsync();
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAsync_FutureAppointment_NotProcessed()
    {
        _context.Followups.Add(new Followup { AgentName = "Future", AppointmentDate = DateTime.UtcNow.AddDays(10), Status = "a_relancer", RelanceCount = 0, UpdatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        var followup = await _context.Followups.FirstAsync();
        followup.Status.Should().Be("a_relancer");
    }

    [Fact]
    public async Task ExecuteAsync_ThriceRelanced_MarksAsLost()
    {
        _context.Followups.Add(new Followup { AgentName = "Lost", AppointmentDate = DateTime.UtcNow.AddDays(-20), Status = "a_relancer", RelanceCount = 2, UpdatedAt = DateTime.UtcNow.AddDays(-20) });
        await _context.SaveChangesAsync();

        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        var followup = await _context.Followups.FirstAsync();
        followup.Status.Should().Be("perdu");
        followup.RelanceCount.Should().Be(3);
    }

    [Fact]
    public async Task StopAsync_CancelsExecution()
    {
        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        cts.Cancel();

        var action = async () => await _sut.StopAsync(CancellationToken.None);
        await action.Should().NotThrowAsync();
    }
}
