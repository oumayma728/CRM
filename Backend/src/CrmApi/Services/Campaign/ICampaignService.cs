using CrmApi.DTOs.Campaign;

namespace CrmApi.Services.Campaign;

public interface ICampaignService
{
    Task<List<CampaignDto>> GetCampaignsAsync();
    Task<CampaignDto?> GetCampaignByIdAsync(int id);
    Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto dto);
    Task<bool> UpdateCampaignAsync(int id, UpdateCampaignDto dto);
    Task<bool> DeleteCampaignAsync(int id);
}
