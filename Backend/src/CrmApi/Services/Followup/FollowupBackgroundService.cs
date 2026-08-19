using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Followup;

public class FollowupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<FollowupBackgroundService> _logger;

    public FollowupBackgroundService(IServiceProvider serviceProvider, ILogger<FollowupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("FollowupBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessFollowupsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing follow-ups");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task ProcessFollowupsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = DateTime.UtcNow;

        var pending = await context.Followups
            .Where(f => f.Status == "a_relancer" && f.AppointmentDate < now)
            .ToListAsync(ct);

        if (pending.Count == 0)
        {
            _logger.LogDebug("No follow-ups to process");
            return;
        }

        _logger.LogInformation("Processing {Count} follow-ups", pending.Count);

        foreach (var f in pending)
        {
            f.RelanceCount++;
            f.Status = f.RelanceCount >= 3 ? "perdu" : "relance_en_cours";
            f.UpdatedAt = now;
        }

        await context.SaveChangesAsync(ct);
        _logger.LogInformation("Processed {Count} follow-ups ({Lost} lost, {Retry} retry)",
            pending.Count,
            pending.Count(f => f.Status == "perdu"),
            pending.Count(f => f.Status == "relance_en_cours"));
    }
}
