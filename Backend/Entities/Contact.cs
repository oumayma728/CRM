namespace Backend.Entities;

public class Contact
{
    public long Id { get; set; }
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string Telephone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Adresse { get; set; }
    
    // Source
    public string Source { get; set; } = string.Empty;
    public DateTime DateImport { get; set; }
    
    // Qualification
    public string Statut { get; set; } = "A_APPELER";
    public string? QualificationDetaillee { get; set; }
    public DateTime? DateDernierAppel { get; set; }
    public int? DureeDernierAppel { get; set; }
    public DateTime? DateRappelPlanifie { get; set; }
    
    // Relations
    public long? AgentId { get; set; }
    public virtual Agent? Agent { get; set; }
    
    public long? FichierImportId { get; set; }
    public virtual FichierImport? FichierSource { get; set; }
    
    public virtual ICollection<Appel> HistoriqueAppels { get; set; } = new List<Appel>();
    public virtual RendezVous? RendezVous { get; set; }
}