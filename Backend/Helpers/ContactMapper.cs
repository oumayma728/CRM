using Backend.DTOs.Agent;
using Backend.Entities;

namespace Backend.Helpers;

/// <summary>
/// One place for the "fiche client" mapping, so that create, update, read and the CSV export
/// all agree on the list of fields.
/// </summary>
public static class ContactMapper
{
    public static ContactDTO ToDto(Contact c) => new()
    {
        Id = c.Id,
        Civilite = c.Civilite,
        Nom = c.Nom,
        Prenom = c.Prenom,
        Telephone = c.Telephone,
        NumGSM = c.NumGSM,
        Email = c.Email,
        Adresse = c.Adresse,
        CodePostal = c.CodePostal,
        Ville = c.Ville,
        Projet = c.Projet,
        Source = c.Source,
        Statut = c.Statut,
        AgentId = c.AgentId,
        AgentNom = c.Agent != null ? $"{c.Agent.Prenom} {c.Agent.Nom}" : null,
        DateRappelPlanifie = c.DateRappelPlanifie,
        EstProprietaire = c.EstProprietaire ?? (c.ProprietaireDepuis != null ? true : null),
        ProprietaireDepuis = c.ProprietaireDepuis?.Year,
        ModeChauffage = c.ModeChauffage,
        ConsommationChauffage = c.ConsommationChauffage,
        AgeChaudiere = c.AgeChaudiere,
        FournisseurEnergie = c.FournisseurEnergie,
        FactureElectricite = c.FactureElectricite,
        EtatToiture = c.EtatToiture,
        EtatIsolation = c.EtatIsolation,
        Surface = c.Surface,
        Surface15m2 = c.Surface15m2,
        TravauxEnCours = c.TravauxEnCours,
        ProjetDemenagement = c.ProjetDemenagement,
        EtudePV = c.EtudePV,
        EquipePV = c.EquipePV,
        EquipePAC = c.EquipePAC,
        NbPersonnes = c.NombrePersonnes,
        ProfessionMr = c.ProfessionMr,
        ProfessionMme = c.ProfessionMme,
        Credits = c.Credits,
        Revenus = c.Revenus,
        Fichage = c.Fichage,
    };

    /// <summary>
    /// Copies the fields the agent filled in onto the contact. A field left empty (null) in the request
    /// never erases what is already stored, so a partial form cannot wipe a fiche.
    /// </summary>
    public static void ApplyFiche(Contact c, CreateContactDTO dto)
    {
        c.Civilite = Clean(dto.Civilite) ?? c.Civilite;
        c.Nom = dto.Nom ?? c.Nom;
        c.Prenom = dto.Prenom ?? c.Prenom;
        c.NumGSM = Clean(dto.NumGSM) ?? c.NumGSM;
        c.Email = dto.Email ?? c.Email;
        c.Adresse = dto.Adresse ?? c.Adresse;
        c.CodePostal = Clean(dto.CodePostal) ?? c.CodePostal;
        c.Ville = Clean(dto.Ville) ?? c.Ville;
        c.Projet = Clean(dto.Projet) ?? c.Projet;

        if (dto.EstProprietaire != null) c.EstProprietaire = dto.EstProprietaire;
        if (dto.ProprietaireDepuis is > 1900 and < 2200)
        {
            c.ProprietaireDepuis = new DateTime(dto.ProprietaireDepuis.Value, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            c.EstProprietaire ??= true;
        }
        c.ModeChauffage = Clean(dto.ModeChauffage) ?? c.ModeChauffage;
        c.ConsommationChauffage = Clean(dto.ConsommationChauffage) ?? c.ConsommationChauffage;
        c.AgeChaudiere = dto.AgeChaudiere ?? c.AgeChaudiere;
        c.FournisseurEnergie = Clean(dto.FournisseurEnergie) ?? c.FournisseurEnergie;
        c.FactureElectricite = Clean(dto.FactureElectricite) ?? c.FactureElectricite;
        c.EtatToiture = Clean(dto.EtatToiture) ?? c.EtatToiture;
        c.EtatIsolation = Clean(dto.EtatIsolation) ?? c.EtatIsolation;
        c.Surface = dto.Surface ?? c.Surface;
        c.Surface15m2 = dto.Surface15m2 ?? c.Surface15m2;
        c.TravauxEnCours = dto.TravauxEnCours ?? c.TravauxEnCours;
        c.ProjetDemenagement = dto.ProjetDemenagement ?? c.ProjetDemenagement;

        c.EtudePV = dto.EtudePV ?? c.EtudePV;
        c.EquipePV = dto.EquipePV ?? c.EquipePV;
        c.EquipePAC = dto.EquipePAC ?? c.EquipePAC;

        c.NombrePersonnes = dto.NbPersonnes ?? c.NombrePersonnes;
        c.ProfessionMr = Clean(dto.ProfessionMr) ?? c.ProfessionMr;
        c.ProfessionMme = Clean(dto.ProfessionMme) ?? c.ProfessionMme;
        c.Credits = Clean(dto.Credits) ?? c.Credits;
        c.Revenus = Clean(dto.Revenus) ?? c.Revenus;

        var fichage = dto.Fichage?.Trim().ToLowerInvariant() switch { "oui" => true, "non" => false, _ => (bool?)null };
        c.Fichage = fichage ?? c.Fichage;
    }

    private static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
}
