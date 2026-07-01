using Backend.Entities;
using Backend.Entities;

namespace Backend.DTOs.Campaign
{
    public class CampaignAgentDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public int AgentId { get; set; }
        public int UserId { get; set; } 
        public string AgentName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime AssignedAt { get; set; }
        public int AssignedByUserId { get; set; }
        public int? Quota { get; set; }

        // Statistics (calculated from CampaignFileContact)
        public int ContactsAssigned { get; set; }
        public int ContactsCalled { get; set; }
        public int RdvCount { get; set; }
    }

    public class AssignAgentToCampaignDto
    {
        public int UserId { get; set; }
        public int AgentId { get; set; }
        public int? Quota { get; set; }
        public int? Weight { get; set; }
        public bool IsActive { get; set; } = true;
    }
  
    public class AvailableAgentDto
        {
            public int Id { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string? Phone { get; set; }
            public bool IsActive { get; set; }
            //public double PerformanceScore { get; set; }
            public bool IsOnline{ get; set; }
        }
    }
