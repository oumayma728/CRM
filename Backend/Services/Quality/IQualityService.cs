using Backend.DTOs.Quality;

namespace Backend.Services.Quality;

public interface IQualityService
{
    Task<bool> CreateEvaluationAsync(int evaluatorId, CreateEvaluationDto dto);
    Task<List<EvaluationDto>> GetAgentEvaluationsAsync(int agentId);
    Task<List<EvaluationDto>> GetAllEvaluationsAsync();
    Task<QualityStatsDto> GetStatsAsync();
    Task<bool> DeleteEvaluationAsync(long evalId);
}
