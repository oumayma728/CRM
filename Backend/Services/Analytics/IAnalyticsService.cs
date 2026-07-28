using Backend.DTOs.Analytics;

namespace Backend.Services.Analytics;

public interface IAnalyticsService
{
    Task<OverviewDto> GetOverviewAsync();
    Task<List<AgentPerformanceDto>> GetAgentsPerformanceAsync();
    Task<SupervisionDto> GetSupervisionAsync();
    Task<GeoDto> GetGeoAsync();
    Task<FollowupStatsDto> GetFollowupsAsync();
    Task<List<CallsLogDto>> GetCallsLogAsync(int limit, string? agentName = null);
    Task<List<object>> GetPointageAsync();
    Task<List<object>> GetLiveAgentsAsync();
    Task<ComparisonDto> GetComparisonAsync();
}
