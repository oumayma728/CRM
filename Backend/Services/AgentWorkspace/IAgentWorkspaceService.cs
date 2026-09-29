using Backend.DTOs.AgentWorkspace;

namespace Backend.Services.AgentWorkspace;

public interface IAgentWorkspaceService
{
    Task<List<AgentSimpleDto>> GetAgentsAsync();
    Task<AgentPerformanceDetailDto> GetAgentPerformanceAsync(string agentId);
    Task<(bool success, string message, int agentId)> SaveAgentDataAsync(int userId, AgentSaveDto dto);
    Task<AgentSaveDto> GetSavedDataAsync(int userId);
}
