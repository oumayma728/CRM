using CrmApi.DTOs.Analytics;

namespace CrmApi.Services.Analytics;

public interface IAnalyticsService
{
    Task<OverviewDto> GetOverviewAsync();
    Task<List<AgentPerformanceDto>> GetAgentsPerformanceAsync();
    Task<SupervisionDto> GetSupervisionAsync();
    Task<GeoDto> GetGeoAsync();
    Task<FollowupStatsDto> GetFollowupsAsync();
    Task<List<CallsLogDto>> GetCallsLogAsync(int limit, string? agentName = null);
    Task<List<CallsTodayDto>> GetCallsTodayAsync();
    Task<List<object>> GetPointageAsync();
    Task<List<object>> GetLiveAgentsAsync();
    Task<ComparisonDto> GetComparisonAsync();
}
