using CrmApi.DTOs.Call;

namespace CrmApi.Services.Call;

public interface ICallService
{
    Task<CallsResponseDto> GetCallsAsync(int userId, string role, string? agentName, string? sentiment, int limit, int offset);
    Task<CallListDto?> GetCallByIdAsync(int callId, int userId, string role);
    Task<CallStatsDto> GetCallStatsAsync(int userId, string role, string? agentName);
    Task<List<AgentSummaryDto>> GetAgentsSummaryAsync();
    Task<(bool success, int callId, string message)> SaveCallAsync(int userId, CallSaveDto dto);
}
