using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Data;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "QUALITE,ADMIN")]
[Produces("application/json")]
public class QualiteController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public QualiteController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── AGENDA REFUS ÉQUIPE ────────────────────────────────────────────────

    /// <summary>Agenda refus de toute l'équipe (sauf signé, posé, VT)</summary>
    [HttpGet("agenda-refus")]
    public async Task<IActionResult> GetAgendaRefus([FromQuery] DateTime? debut, [FromQuery] DateTime? fin)
    {
        var debutUtc = debut.HasValue ? DateTime.SpecifyKind(debut.Value, DateTimeKind.Utc) : (DateTime?)null;
        var finUtc   = fin.HasValue   ? DateTime.SpecifyKind(fin.Value,   DateTimeKind.Utc) : (DateTime?)null;

        var query = _context.RendezVous
            .Include(r => r.Contact)
            .Include(r => r.Agent)
            .Where(r => r.TypeRendezVous == "REFUS");

        if (debutUtc.HasValue) query = query.Where(r => r.DateRendezVous >= debutUtc.Value);
        if (finUtc.HasValue)   query = query.Where(r => r.DateRendezVous <= finUtc.Value);

        var rdvs = await query
            .OrderBy(r => r.DateRendezVous)
            .Select(r => new
            {
                r.Id,
                r.DateRendezVous,
                r.Statut,
                r.TypeRendezVous,
                r.Commentaire,
                r.CommentaireConfirmation,
                Contact = new
                {
                    r.Contact.Id, r.Contact.Nom, r.Contact.Prenom,
                    r.Contact.Telephone, r.Contact.NumGSM,
                    r.Contact.CodePostal, r.Contact.Ville,
                    r.Contact.Adresse, r.Contact.Source,
                    r.Contact.StatutAgent
                },
                Agent = new { r.Agent.Id, r.Agent.Nom, r.Agent.Prenom }
            })
            .ToListAsync();

        return Ok(rdvs);
    }

    // ── LISTE AGENTS ──────────────────────────────────────────────────────

    /// <summary>Liste des agents avec note d'évaluation</summary>
    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents()
    {
        // Materialize first — avoid calling .ToString() inside EF LINQ (can't translate to SQL)
        var agentsRaw = await _context.Agents
            .Select(a => new
            {
                a.Id, a.Nom, a.Prenom, a.Email, a.DateEmbauche, a.IsElite, a.TypeContrat
            })
            .ToListAsync();

        var agentIds = agentsRaw.Select(a => a.Id).ToList();
        var dernieresNotes = await _context.Evaluations
            .Where(e => agentIds.Contains(e.AgentId))
            .Select(e => new { e.AgentId, e.NoteGlobale, e.DateEvaluation })
            .ToListAsync();

        var notesParAgent = dernieresNotes
            .GroupBy(e => e.AgentId)
            .ToDictionary(
                g => g.Key,
                g => (double?)g.OrderByDescending(e => e.DateEvaluation).First().NoteGlobale
            );

        // In-memory projection — safe to call .ToString() / ?. here
        var result = agentsRaw.Select(a => new
        {
            a.Id, a.Nom, a.Prenom, a.Email, a.DateEmbauche, a.IsElite,
            TypeContrat = a.TypeContrat?.ToString(),
            DerniereNote = notesParAgent.TryGetValue(a.Id, out var note) ? note : null
        });

        return Ok(result);
    }

    // ── STATISTIQUES APPELS ───────────────────────────────────────────────

    /// <summary>Statistiques d'appels par agent et par jour</summary>
    [HttpGet("stats-appels")]
    public async Task<IActionResult> GetStatsAppels([FromQuery] DateTime? debut, [FromQuery] DateTime? fin, [FromQuery] long? agentId)
    {
        var debutUtc = debut.HasValue ? DateTime.SpecifyKind(debut.Value, DateTimeKind.Utc) : (DateTime?)null;
        var finUtc   = fin.HasValue   ? DateTime.SpecifyKind(fin.Value,   DateTimeKind.Utc) : (DateTime?)null;

        var query = _context.Appels.Include(a => a.Agent).AsQueryable();

        if (debutUtc.HasValue) query = query.Where(a => a.DateHeure >= debutUtc.Value);
        if (finUtc.HasValue)   query = query.Where(a => a.DateHeure <= finUtc.Value);
        if (agentId.HasValue)  query = query.Where(a => a.AgentId == agentId.Value);

        var appels = await query.ToListAsync();

        var stats = appels
            .GroupBy(a => new { a.AgentId, Date = a.DateHeure.Date })
            .Select(g => new
            {
                g.Key.AgentId,
                g.Key.Date,
                TotalAppels = g.Count(),
                NRP = g.Count(a => a.Qualification == TypeQualification.NRP),
                PasInteresse = g.Count(a => a.Qualification == TypeQualification.REFUS_PAS_INTERESSE),
                RefusPresenceCouple = g.Count(a => a.Qualification == TypeQualification.REFUS_ABSENCE_COUPLE),
                RefusHCConso = g.Count(a => a.Qualification == TypeQualification.REFUS_HORS_CIBLE_CONSO),
                RdvClient1 = g.Count(a => a.Qualification == TypeQualification.RENDEZ_VOUS),
                HCLangue = g.Count(a => a.Qualification == TypeQualification.HORS_CIBLE_AGE),
                HCLogement = g.Count(a => a.Qualification == TypeQualification.HORS_CIBLE_LOGEMENT),
            })
            .OrderBy(s => s.Date)
            .ToList();

        return Ok(stats);
    }

    // ── ÉVALUATION AGENTS ─────────────────────────────────────────────────

    /// <summary>Historique des évaluations d'un agent</summary>
    [HttpGet("evaluations/{agentId:long}")]
    public async Task<IActionResult> GetEvaluationsAgent(long agentId)
    {
        var evals = await _context.Evaluations
            .Where(e => e.AgentId == agentId)
            .OrderByDescending(e => e.DateEvaluation)
            .ToListAsync();

        return Ok(evals);
    }

    /// <summary>Créer une évaluation</summary>
    [HttpPost("evaluations")]
    public async Task<IActionResult> CreateEvaluation([FromBody] CreateEvaluationDTO dto)
    {
        var evaluateurIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!long.TryParse(evaluateurIdStr, out var evaluateurId))
            return Unauthorized();

        var evaluation = new Evaluation
        {
            AgentId = dto.AgentId,
            EvaluateurId = evaluateurId,
            DateEvaluation = DateTime.UtcNow,
            NotePitchCommercial = dto.NotePitchCommercial,
            NoteTraitementObjections = dto.NoteTraitementObjections,
            NoteQualiteAppel = dto.NoteQualiteAppel,
            NoteRespectScript = dto.NoteRespectScript,
            NoteEcoute = dto.NoteEcoute,
            NoteGlobale = (dto.NotePitchCommercial + dto.NoteTraitementObjections +
                           dto.NoteQualiteAppel + dto.NoteRespectScript + dto.NoteEcoute) / 5.0,
            Commentaire = dto.Commentaire,
            AppelId = dto.AppelId
        };

        _context.Evaluations.Add(evaluation);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEvaluationsAgent), new { agentId = dto.AgentId }, evaluation);
    }
}

public class CreateEvaluationDTO
{
    public long AgentId { get; set; }
    public int NotePitchCommercial { get; set; }
    public int NoteTraitementObjections { get; set; }
    public int NoteQualiteAppel { get; set; }
    public int NoteRespectScript { get; set; }
    public int NoteEcoute { get; set; }
    public string? Commentaire { get; set; }
    public long? AppelId { get; set; }
}
