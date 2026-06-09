using Backend.Entities;

namespace Backend.DTOs.Campaign
{
    public class UpdateCampaignDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public CampaignStatus? Status { get; set; }
    }
}