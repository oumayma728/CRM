using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("campaign_file_contacts")]
    public class CampaignFileContact
    {
        [Key]
        public int Id { get; set; }
        public int CampaignFileId { get; set; }
        public int CampaignId { get; set; }
        [ForeignKey("CampaignId")]
        public Campaign? Campaign { get; set; }
        [MaxLength(50)]
        public string? ConfirmationStatus { get; set; }
        public int? ConfirmedByUserId { get; set; }

        [ForeignKey("ConfirmedByUserId")]
        public User? ConfirmedBy { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public int? QualifiedByUserId { get; set; }
        [ForeignKey("CampaignFileId")]
        public CampaignFile? CampaignFile { get; set; }
        public int SourceFileContactId { get; set; }

        [ForeignKey("SourceFileContactId")]
        public SourceFileContact? SourceFileContact { get; set; }
        public int? AssignedAgentId { get; set; }

        [ForeignKey("AssignedAgentId")]
        public User? AssignedAgent { get; set; }

        // Call status tracking
        [MaxLength(50)]
        public string CallStatus { get; set; } = "pending";  // pending, called, qualified, not_qualified, appointment, refused
        [MaxLength(50)]
        public string? QualificationStatus { get; set; }  // nrp, rdv_client1, rdv_client2, refus, pas_interesse, etc.
        public int AttemptCount { get; set; } = 0;
        public int MaxAttempts { get; set; } = 3;
        public DateTime? LastCallAt { get; set; }
        public DateTime? NextCallAt { get; set; }

        // Call results
        public int CallDurationSeconds { get; set; }
        [MaxLength(500)]
        public string? RecordingUrl { get; set; }

        // Appointment tracking (for rdv_client1, rdv_client2)
        [MaxLength(50)]
        public string? AppointmentType { get; set; }  // client1, client2
        public DateTime? AppointmentDate { get; set; }

        // Comments
        public string? AgentComment { get; set; }
        public string? ConfirmationComment { get; set; }
        public string? CommercialComment { get; set; }


        // Tracking
        public DateTime? AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime? QualifiedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? Projet { get; set; }
        //fiche de clients
        public int? ProprietaireDepuis { get; set; }
        [MaxLength(50)]
        public string? ModeChauffage { get; set; }
        [MaxLength(50)]
        public string? ConsommationChauffage { get; set; }
        public int? AgeChaudiere { get; set; }
        public bool? EquipePV { get; set; }
        public bool? EquipePAC { get; set; }
        [MaxLength(50)]
        public string? EtatToiture { get; set; }
        [MaxLength(50)]
        public string? EtatIsolation { get; set; }
        public int? NbrePersonnes { get; set; }
        [MaxLength(100)]
        public string? ProfessionMr { get; set; }
        [MaxLength(100)]
        public string? ProfessionMme { get; set; }
        [MaxLength(50)]
        public string? Revenus { get; set; }
        public bool? Credits { get; set; }
        public bool? Fichage { get; set; }
        public bool IsAssignable { get; set; } = false;
        public DateTime? ActivatedAt { get; set; }
        public double RandomOrder { get; set; }
        public int AssignmentPriority { get; set; } = 0;
        [MaxLength(50)]
        public string? NextAction { get; set; }

    }
}