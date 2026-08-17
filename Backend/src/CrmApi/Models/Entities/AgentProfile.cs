using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("agent_profiles")]
    public class AgentProfile
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        // ==================== CONTRACT & BASIC INFO ====================
        public DateTime? HireDate { get; set; }
        public string TypeContrat { get; set; } = "PLEIN_TEMPS"; // "PLEIN_TEMPS", "MI_TEMPS"
        public int ObjectifMensuel { get; set; } = 0;
        public decimal SalaireBase { get; set; } = 0;
        public decimal PrimeAssiduite { get; set; } = 100;

        // ==================== PERFORMANCE METRICS ====================
        public int TotalRdv { get; set; } = 0;
        public int TotalRdvConfirme { get; set; } = 0;
        public int TotalRdvSigne { get; set; } = 0;
        public int TotalRdvAnnule { get; set; } = 0;
        public int TotalPose { get; set; } = 0;
        public decimal NoteEvaluationMoyenne { get; set; } = 0;

        // ==================== ACTIVITY ====================
        public DateTime? DerniereActivite { get; set; }
        public string? Notes { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}