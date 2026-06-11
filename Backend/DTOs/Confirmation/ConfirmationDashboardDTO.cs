namespace Backend.DTOs.Confirmation;

public class ConfirmationDashboardDTO
{
    public int TotalRdv { get; set; }
    public int RdvConfirmes { get; set; }
    public int RdvAnnules { get; set; }
    public int RdvReportes { get; set; }
    public int NRP { get; set; }
    public List<RdvConfirmationDTO> RdvRecents { get; set; } = new();
    public List<StatutParJourDTO> StatsParJour { get; set; } = new();
}

public class RdvConfirmationDTO
{
    public long Id { get; set; }
    public string ContactNom { get; set; } = string.Empty;
    public string ContactPrenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Adresse { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string AgentNom { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
    public DateTime DateRendezVous { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string? Commentaire { get; set; }
    public string? CommentaireBanque { get; set; }
}

public class StatutParJourDTO
{
    public DateTime Date { get; set; }
    public int Confirme { get; set; }
    public int Annule { get; set; }
    public int NRP { get; set; }
}