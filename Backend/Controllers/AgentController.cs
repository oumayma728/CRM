using Microsoft.AspNetCore.Mvc;
using Backend.DTOs.Agent;
using Backend.Services.Agent;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AgentController : ControllerBase
{
    private readonly IAgentService _service;

    public AgentController(IAgentService service)
    {
        _service = service;
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    /// <summary>Récupère tous les agents</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AgentDTO>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var agents = await _service.GetAllAgentsAsync();
        return Ok(agents);
    }

    /// <summary>Récupère un agent par son ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(AgentDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(long id)
    {
        var agent = await _service.GetAgentByIdAsync(id);
        return agent == null ? NotFound(new { message = $"Agent {id} introuvable." }) : Ok(agent);
    }

    /// <summary>Crée un nouvel agent</summary>
    [HttpPost]
    [ProducesResponseType(typeof(AgentDTO), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Create([FromBody] CreateAgentDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var created = await _service.CreateAgentAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Met à jour un agent</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(AgentDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateAgentDTO dto)
    {
        var updated = await _service.UpdateAgentAsync(id, dto);
        return updated == null
            ? NotFound(new { message = $"Agent {id} introuvable." })
            : Ok(updated);
    }

    /// <summary>Supprime un agent</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(long id)
    {
        var success = await _service.DeleteAgentAsync(id);
        return success ? NoContent() : NotFound(new { message = $"Agent {id} introuvable." });
    }

    
    // ─── APPELS ──────────────────────────────────────────────────────────────

    /// <summary>Récupère l'historique des appels d'un agent</summary>
    [HttpGet("{id:long}/appels")]
    [ProducesResponseType(typeof(IEnumerable<AppelDTO>), 200)]
    public async Task<IActionResult> GetAppels(long id)
    {
        var appels = await _service.GetAppelsParAgentAsync(id);
        return Ok(appels);
    }

    /// <summary>Enregistre un appel avec qualification</summary>
    [HttpPost("appels")]
    [ProducesResponseType(typeof(AppelDTO), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> EnregistrerAppel([FromBody] CreateAppelDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var appel = await _service.EnregistrerAppelAsync(dto);
            return Ok(appel);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─── PERFORMANCE ─────────────────────────────────────────────────────────

    /// <summary>Récupère les performances d'un agent pour un mois donné</summary>
    /// <param name="id">ID de l'agent</param>
    /// <param name="annee">Exemple : 2026</param>
    /// <param name="mois">Exemple : 4 (avril)</param>
    [HttpGet("{id:long}/performance")]
    [ProducesResponseType(typeof(PerformanceDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPerformance(
        long id,
        [FromQuery] int annee,
        [FromQuery] int mois)
    {
        if (annee < 2020 || mois < 1 || mois > 12)
            return BadRequest(new { message = "Année ou mois invalide." });

        try
        {
            var perf = await _service.GetPerformanceAsync(id, annee, mois);
            return Ok(perf);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erreur: {ex.Message}" });
        }
    }

    // ─── RÉMUNÉRATION ────────────────────────────────────────────────────────

    /// <summary>Calcule la rémunération estimée d'un agent pour un mois donné</summary>
    [HttpGet("{id:long}/remuneration")]
    [ProducesResponseType(typeof(RemunerationDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetRemuneration(
        long id,
        [FromQuery] int annee,
        [FromQuery] int mois)
    {
        if (annee < 2020 || mois < 1 || mois > 12)
            return BadRequest(new { message = "Année ou mois invalide." });

        try
        {
            var rem = await _service.CalculerRemunerationAsync(id, annee, mois);
            return Ok(rem);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ─── POINTAGE ────────────────────────────────────────────────────────────

    /// <summary>Récupère les pointages d'un agent</summary>
    [HttpGet("{id:long}/pointages")]
    [ProducesResponseType(typeof(IEnumerable<PointageDTO>), 200)]
    public async Task<IActionResult> GetPointages(
        long id,
        [FromQuery] DateTime? dateDebut,
        [FromQuery] DateTime? dateFin)
    {
        var pointages = await _service.GetPointagesAsync(id, dateDebut, dateFin);
        return Ok(pointages);
    }

    // ─── SÉCURITÉ PC ─────────────────────────────────────────────────────────

    /// <summary>Vérifie ou enregistre l'empreinte PC d'un agent</summary>
    [HttpPost("{id:long}/verifier-pc")]
    [ProducesResponseType(200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> VerifierPC(long id, [FromBody] VerifierPCDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var agent = await _service.GetAgentByIdAsync(id);
        if (agent == null)
            return NotFound(new { message = $"Agent {id} introuvable." });

        var autorise = await _service.VerifierEmpreintePCAsync(id, dto.IdentifiantMachine);

        if (!autorise)
            return StatusCode(403, new
            {
                message = "Connexion refusée : ce PC n'est pas le poste principal de l'agent. L'administration a été notifiée."
            });

        return Ok(new { autorise = true, message = "Connexion autorisée." });
    }
}