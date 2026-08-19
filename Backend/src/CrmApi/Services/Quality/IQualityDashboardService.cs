using CrmApi.DTOs.Quality;

namespace CrmApi.Services.Quality;

public interface IQualityDashboardService
{
    Task<TeamStatusCardDto> GetTeamStatusAsync();
    Task<List<AgentStateRowDto>> GetAgentsStateAsync();
    Task<GlobalStatsDto> GetGlobalStatsAsync();
    Task<List<QualityAlertItemDto>> GetDashboardAlertsAsync();
    Task<List<EvaluationHistoryRowDto>> GetEvaluationHistoryAsync(int limit, int offset);
    Task<AgentDetailDto> GetAgentDetailAsync(int agentId);
    Task<RdvJourDto> GetRdvJourAsync();
    Task<DashboardComparisonDto> GetComparisonAsync();
}
