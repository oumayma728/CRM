namespace Backend.DTOs.Agent;

public class CreateContactDTO
{
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public required string Telephone { get; set; }
    public string? Email { get; set; }
    public string? Adresse { get; set; }
    public string Source { get; set; } = string.Empty;
}

public class UpdateContactDTO
{
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public string? Adresse { get; set; }
    public string? Source { get; set; }
    public string? Statut { get; set; }
    public long? AgentId { get; set; }
}

public class ContactDTO
{
    public long Id { get; set; }
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string Telephone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Adresse { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public long? AgentId { get; set; }
    public string? AgentNom { get; set; }  // ← AJOUTER CETTE LIGNE
    public DateTime? DateRappelPlanifie { get; set; }
}