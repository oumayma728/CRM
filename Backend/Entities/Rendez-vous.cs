namespace Backend.Entities;

public class RendezVous
{
    public long Id { get; set; }
    public long ContactId { get; set; }
    public virtual Contact Contact { get; set; } = null!;
    
    public long AgentId { get; set; }
    public virtual Agent Agent { get; set; } = null!;
    
    public long? CommercialId { get; set; }
    public virtual Commercial? Commercial { get; set; }
    
    public DateTime DateCreation { get; set; }
    public DateTime DateRendezVous { get; set; }
    public StatutRendezVous Statut { get; set; }
    public string? TypeProjet { get; set; }
    public string? Commentaire { get; set; }
    public DateTime? DateReport { get; set; }
    
    // Ajouter ces propriétés
    public string? CommentaireBanque { get; set; }
    public string? MotifRefus { get; set; }
    public bool ARecontacter { get; set; }
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
    INSTALLE
}