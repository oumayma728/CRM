namespace CrmApi.Models.Entities;

public class RendezVous
{
    public long Id { get; set; }
    public long ContactId { get; set; }
    public virtual Contact Contact { get; set; } = null!;

    public int AgentId { get; set; }
    public virtual Agent Agent { get; set; } = null!;

    public long? CommercialId { get; set; }
    public virtual Commercial? Commercial { get; set; }

    public DateTime DateCreation { get; set; }
    public DateTime DateRendezVous { get; set; }
    public StatutRendezVous Statut { get; set; }
    public string? TypeProjet { get; set; }

    /// <summary>CLIENT1 | CLIENT2 | EBI | REFUS</summary>
    public string? TypeRendezVous { get; set; }

    // ── Commentaires par rôle ──────────────────────────────────────────────
    public string? Commentaire { get; set; }               // agent
    public string? CommentaireConfirmation { get; set; }   // confirmatrice EBI/client1
    public string? CommentaireCommercial { get; set; }     // commercial
    public string? CommentaireBanque { get; set; }         // confirmatrice client (banque)

    public string? MotifRefus { get; set; }
    public bool ARecontacter { get; set; }
    public DateTime? DateReport { get; set; }
}

public enum StatutRendezVous
{
    BRUT,
    CONFIRME,
    ANNULE,
    REPORTER,
    HORS_CIBLE,
    SIGNE,
    NON_SIGNE,
    INSTALLE,
    R2,
    NRP,
    PORTE
}