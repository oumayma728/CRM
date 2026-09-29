using Backend.Data;
using Backend.Services.WebSocket;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Services.Alerts;

public class InactivityAlertService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InactivityAlertService> _logger;

    public InactivityAlertService(IServiceProvider serviceProvider, ILogger<InactivityAlertService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("InactivityAlertService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckInactivityAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking inactivity");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task CheckInactivityAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var wsManager = scope.ServiceProvider.GetRequiredService<WebSocketConnectionManager>();

        var threshold = DateTime.UtcNow.AddMinutes(-30);
        var inactiveAttendances = await context.AdvancedAttendances
            .Where(a => a.Status == "active" && a.ClockIn < threshold)
            .Include(a => a.User)
            .ToListAsync(ct);

        foreach (var attendance in inactiveAttendances)
        {
            var inactiveMinutes = (int)(DateTime.UtcNow - attendance.ClockIn).TotalMinutes;

            var alert = new
            {
                type = "inactivity_alert",
                userId = attendance.UserId,
                userName = (attendance.User != null ? attendance.User.Prenom + " " + attendance.User.Nom : null) ?? "Unknown",
                message = $"Inactivité détectée : {(attendance.User != null ? attendance.User.Prenom + " " + attendance.User.Nom : null)} est pointé depuis {inactiveMinutes} minutes sans activité",
                inactiveMinutes,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(alert);
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);

            if (wsManager.TryGetConnection(attendance.UserId, out var socket) &&
                socket is not null && socket.State == System.Net.WebSockets.WebSocketState.Open)
            {
                try
                {
                    await socket.SendAsync(
                        new ArraySegment<byte>(bytes),
                        System.Net.WebSockets.WebSocketMessageType.Text,
                        true,
                        ct
                    );
                    _logger.LogWarning("Inactivity alert sent to user {UserId}", attendance.UserId);
                }
                catch
                {
                    wsManager.Remove(attendance.UserId);
                }
            }
        }
    }
}
