using Backend.DTOs.Quality;

namespace Backend.Services.Quality;

public interface IQualityService
{
    Task<bool> CreateEvaluationAsync(long evaluatorId, CreateEvaluationDto dto);
    Task<List<EvaluationDto>> GetAgentEvaluationsAsync(long agentId);
    Task<List<EvaluationDto>> GetAllEvaluationsAsync();
    Task<QualityStatsDto> GetStatsAsync();
    Task<bool> DeleteEvaluationAsync(long evalId);
}
