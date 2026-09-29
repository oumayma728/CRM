using System.Net.WebSockets;
using Backend.Data;
using Backend.Entities;
using Backend.Services.Alerts;
using Backend.Services.WebSocket;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using SysWebSocket = System.Net.WebSockets.WebSocket;

namespace CRM.API.Tests.Services;

public class InactivityAlertServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Mock<ILogger<InactivityAlertService>> _mockLogger;
    private readonly WebSocketConnectionManager _wsManager;
    private readonly InactivityAlertService _sut;

    public InactivityAlertServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_inactivity_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockLogger = new Mock<ILogger<InactivityAlertService>>();
        _wsManager = new WebSocketConnectionManager();

        var services = new ServiceCollection();
        services.AddSingleton(_context);
        services.AddSingleton(_wsManager);
        var serviceProvider = services.BuildServiceProvider();

        _sut = new InactivityAlertService(serviceProvider, _mockLogger.Object);
    }

    [Fact]
    public async Task ExecuteAsync_NoInactiveUsers_DoesNothing()
    {
        var user = new Agent { Prenom = "Active", Nom = "User", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.Add(user);
        _context.AdvancedAttendances.Add(new AdvancedAttendance
        {
            UserId = user.Id,
            Date = DateTime.UtcNow,
            ClockIn = DateTime.UtcNow.AddMinutes(-5),
            Status = "active",
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
        });
        await _context.SaveChangesAsync();

        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        var attendance = await _context.AdvancedAttendances.FirstAsync();
        attendance.Status.Should().Be("active");
    }

    [Fact]
    public async Task ExecuteAsync_WithInactiveUser_SendsAlert()
    {
        var user = new Agent { Prenom = "Inactive", Nom = "User", Email = "i@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.Add(user);
        _context.AdvancedAttendances.Add(new AdvancedAttendance
        {
            UserId = user.Id,
            Date = DateTime.UtcNow,
            ClockIn = DateTime.UtcNow.AddHours(-1),
            Status = "active",
            CreatedAt = DateTime.UtcNow.AddHours(-1),
        });
        await _context.SaveChangesAsync();

        _wsManager.Add(user.Id, new MockWebSocket());

        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Inactivity alert sent")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_CompletedAttendance_Ignored()
    {
        var user = new Agent { Prenom = "Completed", Nom = "User", Email = "c@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.Add(user);
        _context.AdvancedAttendances.Add(new AdvancedAttendance
        {
            UserId = user.Id,
            Date = DateTime.UtcNow,
            ClockIn = DateTime.UtcNow.AddHours(-2),
            ClockOut = DateTime.UtcNow.AddHours(-1),
            Status = "completed",
            CreatedAt = DateTime.UtcNow.AddHours(-2),
        });
        await _context.SaveChangesAsync();

        var cts = new CancellationTokenSource();
        await _sut.StartAsync(cts.Token);
        await Task.Delay(500);
        await _sut.StopAsync(cts.Token);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Inactivity alert sent")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
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

    private class MockWebSocket : SysWebSocket
    {
        public override WebSocketState State { get; } = WebSocketState.Open;
        public override WebSocketCloseStatus? CloseStatus => null;
        public override string? CloseStatusDescription => null;
        public override string? SubProtocol => null;

        public override void Abort() { }
        public override Task CloseAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
            => Task.CompletedTask;
        public override Task CloseOutputAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
            => Task.CompletedTask;
        public override void Dispose() { }
        public override Task<WebSocketReceiveResult> ReceiveAsync(ArraySegment<byte> buffer, CancellationToken cancellationToken)
            => Task.FromResult(new WebSocketReceiveResult(0, WebSocketMessageType.Text, true));
        public override Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType messageType, bool endOfMessage, CancellationToken cancellationToken)
            => Task.CompletedTask;
    }
}
