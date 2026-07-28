using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services;

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

        var threshold = DateTime.UtcNow.AddMinutes(-30);
        var inactiveAttendances = await context.AdvancedAttendances
            .Include(a => a.User)
            .Where(a => a.Status == "active" && a.ClockIn < threshold)
            .ToListAsync(ct);

        foreach (var attendance in inactiveAttendances)
        {
            var inactiveMinutes = (int)(DateTime.UtcNow - attendance.ClockIn).TotalMinutes;
            var userName = attendance.User != null
                ? $"{attendance.User.Prenom} {attendance.User.Nom}"
                : "Unknown";

            _logger.LogWarning(
                "Inactivity detected: {UserName} clocked in since {InactiveMinutes} minutes without activity",
                userName, inactiveMinutes);
        }
    }
}
