using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("users")]
    public class User
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [MaxLength(20)]
        public UserRole Role { get; set; } = UserRole.Agent;
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;
        [MaxLength(255)]
        public string? ResetToken { get; set; }
        public DateTime? ResetTokenExpiry { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsOnline { get; set; }

        // Navigation properties
        public AgentProfile? AgentProfile { get; set; }
        public ICollection<AgentSavedData> SavedData { get; set; } = new List<AgentSavedData>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<CrmAppointment> CrmAppointments { get; set; } = new List<CrmAppointment>();
        public ICollection<ManualEvaluation> GivenEvaluations { get; set; } = new List<ManualEvaluation>();
        public ICollection<ManualEvaluation> ReceivedEvaluations { get; set; } = new List<ManualEvaluation>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Salary> Salaries { get; set; } = new List<Salary>();
    }
}