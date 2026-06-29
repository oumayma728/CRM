using Backend.Entities;

namespace Backend.DTOs.Campaign
{
    public class CreateCampaignDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public CampaignStatus Status { get; set; } = CampaignStatus.Active;
        // Optional: List of SourceFile IDs to associate
        public List<int>? SourceFileIds { get; set; }
        // Optional: List of Agent IDs to assign
        public List<int>? AgentsIds { get; set; }
    }
}