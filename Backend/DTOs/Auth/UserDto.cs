using Backend.Entities;

namespace Backend.DTOs.Auth
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public bool IsOnline { get; set; }
        public AgentPresenceStatus PresenceStatus { get; set; }
        public DateTime? PresenceChangedAt { get; set; }
        public DateTime? LastHeartbeatAt { get; set; }
        public List<string> Permissions { get; set; } = new();
    }
}
