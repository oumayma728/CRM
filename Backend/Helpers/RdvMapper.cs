using Backend.DTOs.Confirmation;
using Backend.Entities;

namespace Backend.Helpers;

/// <summary>
/// The full "RDV + fiche client" mapping, written once. Every agenda (confirmation 1, 2, client, commercial)
/// uses it, so the side panel shows the same information whichever agenda the RDV is opened from.
/// </summary>
public static class RdvMapper
{
    public static RdvConfirmationDTO ToConfirmationDto(RendezVous r)
    {
        var c = r.Contact;
        return new RdvConfirmationDTO
        {
            Id = r.Id,
            ContactId = c?.Id ?? 0,
            Civilite = c?.Civilite,
            ContactNom = c?.Nom ?? "",
            ContactPrenom = c?.Prenom ?? "",
            Telephone = c?.Telephone ?? "",
            NumGSM = c?.NumGSM,
            Email = c?.Email,
            Adresse = c?.Adresse,
            CodePostal = c?.CodePostal,
            Ville = c?.Ville,
            Source = c?.Source ?? "",
            AgentId = r.AgentId,
            AgentNom = r.Agent != null ? $"{r.Agent.Prenom} {r.Agent.Nom}" : "",
            DateCreation = r.DateCreation,
            DateRendezVous = r.DateRendezVous,
            Statut = r.Statut.ToString(),
            TypeRendezVous = r.TypeRendezVous,
            CommentaireAgent = r.Commentaire,
            CommentaireConfirmation = r.CommentaireConfirmation,
            CommentaireBanque = r.CommentaireBanque,
            Projet = c?.Projet,
            EstProprietaire = c == null ? null : c.EstProprietaire ?? (c.ProprietaireDepuis != null ? true : null),
            ProprietaireDepuis = c?.ProprietaireDepuis,
            ModeChauffage = c?.ModeChauffage,
            ConsommationChauffage = c?.ConsommationChauffage,
            AgeChaudiere = c?.AgeChaudiere,
            FournisseurEnergie = c?.FournisseurEnergie,
            FactureElectricite = c?.FactureElectricite,
            EtudePV = c?.EtudePV,
            EquipePV = c?.EquipePV,
            EquipePAC = c?.EquipePAC,
            EtatToiture = c?.EtatToiture,
            EtatIsolation = c?.EtatIsolation,
            Surface = c?.Surface,
            Surface15m2 = c?.Surface15m2,
            TravauxEnCours = c?.TravauxEnCours,
            ProjetDemenagement = c?.ProjetDemenagement,
            NombrePersonnes = c?.NombrePersonnes,
            ProfessionMr = c?.ProfessionMr,
            ProfessionMme = c?.ProfessionMme,
            Credits = c?.Credits,
            Revenus = c?.Revenus,
            Fichage = c?.Fichage,
        };
    }
}
