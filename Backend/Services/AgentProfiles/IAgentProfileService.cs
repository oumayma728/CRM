using Backend.DTOs.AgentProfiles;

namespace Backend.Services.AgentProfiles
{
    public interface IAgentProfileService
    {
        Task<List<AgentResponseDto>> GetAllAgentsAsync();
        Task<AgentResponseDto?> GetAgentByIdAsync(int id);
        Task<AgentResponseDto> CreateAgentAsync(CreateAgentDto dto, int createdByUserId);
        Task<AgentResponseDto?> UpdateAgentAsync(int id, UpdateAgentDto dto);
        Task<bool> DeleteAgentAsync(int id);
        Task<List<AgentCampaignSummaryDto>> GetAgentCampaignsAsync(int id);
        Task<List<AgentAppointmentDto>> GetAgentAppointmentsAsync(int id);
    }
}
