using CrmApi.DTOs.Quality;

namespace CrmApi.Services.Quality;

public interface IQualityService
{
    Task<bool> CreateEvaluationAsync(int evaluatorId, CreateEvaluationDto dto);
    Task<List<EvaluationDto>> GetAgentEvaluationsAsync(int agentId);
    Task<List<EvaluationDto>> GetAllEvaluationsAsync();
    Task<QualityStatsDto> GetStatsAsync();
    Task<bool> DeleteEvaluationAsync(int evalId);
}
