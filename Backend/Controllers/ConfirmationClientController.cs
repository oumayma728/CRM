using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs.Confirmation;
using Backend.Entities;
using Backend.Constants;
using Backend.Attributes;

namespace Backend.Controllers;

[ApiController]
[Route("api/confirmation-client")]
[Authorize(Roles = "CONFCLIENT")]
public class ConfirmationClientController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ConfirmationClientController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================
    // DASHBOARD
    // =========================

    [HttpGet("dashboard")]
    [RequirePermission(Permissions.ConfirmationClientView)]
    public async Task<IActionResult> GetDashboard()
    {
        var aujourd = DateTime.UtcNow.Date;
        
        var rdvs = await _context.RendezVous
            .Include(r => r.Contact)
            .Include(r => r.Agent)
            .Include(r => r.Commercial)
            .Where(r => r.Statut == StatutRendezVous.CONFIRME && r.CommercialId == null)
            .OrderBy(r => r.DateRendezVous)
            .Take(50)
            .ToListAsync();

        var result = new ConfirmationDashboardDTO
        {
            TotalRdv = rdvs.Count,
            RdvConfirmes = rdvs.Count(r => r.Statut == StatutRendezVous.CONFIRME),
            RdvAnnules = rdvs.Count(r => r.Statut == StatutRendezVous.ANNULE),
            RdvReportes = rdvs.Count(r => r.Statut == StatutRendezVous.REPORTER),
            RdvRecents = rdvs.Select(r => new RdvConfirmationDTO
            {
                Id = r.Id,
                ContactNom = r.Contact?.Nom ?? "",
                ContactPrenom = r.Contact?.Prenom ?? "",
                Telephone = r.Contact?.Telephone ?? "",
                Source = r.Contact?.Source ?? "",
                AgentNom = r.Agent != null ? $"{r.Agent.Prenom} {r.Agent.Nom}" : "",
                DateCreation = r.DateCreation,
                DateRendezVous = r.DateRendezVous,
                Statut = r.Statut.ToString()
            }).ToList()
        };

        return Ok(result);
    }

    // =========================
    // AGENDA CLIENT
    // =========================

    [HttpGet("agenda")]
    [RequirePermission(Permissions.ConfirmationClientAgenda)]
    public async Task<IActionResult> GetAgenda()
    {
        var rdvs = await _context.RendezVous
            .Include(r => r.Contact)
            .Include(r => r.Agent)
            .Include(r => r.Commercial)
            .Where(r => r.Statut == StatutRendezVous.CONFIRME)
            .OrderBy(r => r.DateRendezVous)
            .ToListAsync();

        return Ok(rdvs.Select(r => new RdvConfirmationDTO
        {
            Id = r.Id,
            ContactNom = r.Contact?.Nom ?? "",
            ContactPrenom = r.Contact?.Prenom ?? "",
            Telephone = r.Contact?.Telephone ?? "",
            Source = r.Contact?.Source ?? "",
            AgentNom = r.Agent != null ? $"{r.Agent.Prenom} {r.Agent.Nom}" : "",
            DateCreation = r.DateCreation,
            DateRendezVous = r.DateRendezVous,
            Statut = r.Statut.ToString(),
            Commentaire = r.Commentaire
        }));
    }

    // =========================
    // SUIVI COMMERCIAUX
    // =========================

    [HttpGet("commerciaux")]
    [RequirePermission(Permissions.ConfirmationClientCommercials)]
    public async Task<IActionResult> GetCommerciaux()
    {
        var commerciaux = await _context.Commerciaux
            .Select(c => new CommercialDTO
            {
                Id = c.Id,
                Nom = c.Nom,
                Prenom = c.Prenom,
                Email = c.Email,
                TotalRdv = _context.RendezVous.Count(r => r.CommercialId == c.Id),
                RdvSignes = _context.RendezVous.Count(r => r.CommercialId == c.Id && r.Statut == StatutRendezVous.SIGNE),
                TauxSignature = 0,
                ChiffreAffaire = 0
            })
            .ToListAsync();

        foreach (var commercial in commerciaux)
        {
            if (commercial.TotalRdv > 0)
            {
                commercial.TauxSignature = Math.Round((double)commercial.RdvSignes / commercial.TotalRdv * 100, 1);
            }
        }

        return Ok(commerciaux);
    }

    // =========================
    // ATTRIBUTION RDV
    // =========================

    [HttpGet("rdv-disponibles")]
    [RequirePermission(Permissions.ConfirmationClientAssign)]
    public async Task<IActionResult> GetRdvsDisponibles()
    {
        var rdvs = await _context.RendezVous
            .Include(r => r.Contact)
            .Include(r => r.Agent)
            .Where(r => r.Statut == StatutRendezVous.CONFIRME && r.CommercialId == null)
            .OrderBy(r => r.DateRendezVous)
            .ToListAsync();

        return Ok(rdvs.Select(r => new RdvConfirmationDTO
        {
            Id = r.Id,
            ContactNom = r.Contact?.Nom ?? "",
            ContactPrenom = r.Contact?.Prenom ?? "",
            Telephone = r.Contact?.Telephone ?? "",
            Source = r.Contact?.Source ?? "",
            AgentNom = r.Agent != null ? $"{r.Agent.Prenom} {r.Agent.Nom}" : "",
            DateCreation = r.DateCreation,
            DateRendezVous = r.DateRendezVous,
            Statut = r.Statut.ToString()
        }));
    }

    [HttpPost("rdv/{id}/assigner")]
    [RequirePermission(Permissions.ConfirmationClientAssign)]
    public async Task<IActionResult> AssignerCommercial(long id, [FromBody] AssignerCommercialDTO dto)
    {
        var rdv = await _context.RendezVous.FindAsync(id);
        if (rdv == null)
            return NotFound(new { message = "Rendez-vous non trouvé" });

        rdv.CommercialId = dto.CommercialId;
        rdv.Statut = StatutRendezVous.CONFIRME;
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Rendez-vous assigné au commercial" });
    }

    // =========================
    // MISE À JOUR STATUT RDV
    // =========================

    [HttpPut("rdv/{id}/statut")]
    [RequirePermission(Permissions.ConfirmationClientEdit)]
    public async Task<IActionResult> UpdateRdvStatut(long id, [FromBody] UpdateRdvStatutDTO dto)
    {
        var rdv = await _context.RendezVous.FindAsync(id);
        if (rdv == null)
            return NotFound(new { message = "Rendez-vous non trouvé" });

        rdv.Statut = Enum.Parse<StatutRendezVous>(dto.Statut);
        rdv.Commentaire = dto.Commentaire;
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Statut mis à jour" });
    }

    // =========================
    // COMMENTAIRE BANQUE (optionnel - à implémenter après migration)
    // =========================

    [HttpPut("rdv/{id}/banque")]
    [RequirePermission(Permissions.ConfirmationClientBankComment)]
    public async Task<IActionResult> UpdateCommentaireBanque(long id, [FromBody] UpdateBanqueDTO dto)
    {
        var rdv = await _context.RendezVous.FindAsync(id);
        if (rdv == null)
            return NotFound();
        
        // TODO: Ajouter CommentaireBanque au modèle RendezVous d'abord
        // rdv.CommentaireBanque = dto.CommentaireBanque;
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Fonctionnalité à venir - ajouter CommentaireBanque au modèle" });
    }
}