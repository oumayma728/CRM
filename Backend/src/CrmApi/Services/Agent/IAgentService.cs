using CrmApi.DTOs.Agent;

namespace CrmApi.Services.Agent;

public interface IAgentService
{
    Task<List<AgentSimpleDto>> GetAgentsAsync();
    Task<AgentPerformanceDetailDto> GetAgentPerformanceAsync(string agentId);
    Task<(bool success, string message, int agentId)> SaveAgentDataAsync(int userId, AgentSaveDto dto);
    Task<AgentSaveDto> GetSavedDataAsync(int userId);
}
