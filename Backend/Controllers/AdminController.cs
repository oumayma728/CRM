using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs.Admin;
using Backend.Services.Admin;

namespace Backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var data = await _adminService.GetDashboardLiveAsync();
        return Ok(data);
    }

    [HttpGet("agents/statut")]
    public async Task<IActionResult> GetAgentsStatut()
    {
        var agents = await _adminService.GetAgentsStatutAsync();
        return Ok(agents);
    }

    [HttpGet("scorecards")]
    public async Task<IActionResult> GetScorecards()
    {
        var scorecards = await _adminService.GetScorecardsAgentsAsync();
        return Ok(scorecards);
    }

    [HttpGet("agents/suivi")]
    public async Task<IActionResult> GetAgentsSuivi()
    {
        var suivi = await _adminService.GetAgentsSuiviAsync();
        return Ok(suivi);
    }

    [HttpGet("pointage")]
    public async Task<IActionResult> GetPointage([FromQuery] DateTime? date)
    {
        var pointage = await _adminService.GetPointageAsync(date ?? DateTime.Today);
        return Ok(pointage);
    }

    [HttpGet("carte-geographique")]
    public async Task<IActionResult> GetCarteGeographique([FromQuery] string pays = "all")
    {
        var carte = await _adminService.GetCarteGeographiqueAsync(pays);
        return Ok(carte);
    }

    [HttpGet("ia/config")]
    public async Task<IActionResult> GetIAConfig()
    {
        var config = await _adminService.GetConfigurationIAAsync();
        return Ok(config);
    }

    [HttpPut("ia/config")]
    public async Task<IActionResult> UpdateIAConfig([FromBody] ConfigurationIADTO config)
    {
        await _adminService.UpdateConfigurationIAAsync(config);
        return Ok(new { message = "Configuration mise à jour" });
    }

    [HttpGet("utilisateurs")]
    public async Task<IActionResult> GetUtilisateurs()
    {
        var users = await _adminService.GetUtilisateursAsync();
        return Ok(users);
    }

    [HttpPost("utilisateurs")]
    public async Task<IActionResult> CreateUtilisateur([FromBody] UtilisateurRequestDTO request)
    {
        var user = await _adminService.CreateUtilisateurAsync(request);
        return CreatedAtAction(nameof(GetUtilisateurs), new { id = user.Id }, user);
    }

    [HttpDelete("utilisateurs/{id}")]
    public async Task<IActionResult> DeleteUtilisateur(long id)
    {
        await _adminService.DeleteUtilisateurAsync(id);
        return NoContent();
    }

    // =========================================================================
    // GESTION DES AGENDAS DES CONFIRMATRICES
    // =========================================================================

    /// <summary>
    /// Récupère la liste des confirmatrices avec leurs agendas assignés
    /// </summary>
    [HttpGet("confirmatrices/agendas")]
    public async Task<IActionResult> GetConfirmatricesAgendas()
    {
        var result = await _adminService.GetConfirmatricesAgendasAsync();
        return Ok(result);
    }

    /// <summary>
    /// Assigne ou retire un agenda à une confirmatrice
    /// </summary>
    [HttpPut("confirmatrices/{id}/assign-agenda")]
    public async Task<IActionResult> AssignAgendaToConfirmatrice(long id, [FromBody] AssignAgendaDTO dto)
    {
        try
        {
            var result = await _adminService.AssignAgendaToConfirmatriceAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Récupère la liste des agendas disponibles pour assignation
    /// </summary>
    [HttpGet("agendas/disponibles")]
    public IActionResult GetAgendasDisponibles()
    {
        var agendas = new List<AgendaDisponibleDTO>
        {
            new() { Id = "CLIENT1", Nom = "Agenda Client 1", Description = "Gestion des rendez-vous client de type 1", Icon = "👤" },
            new() { Id = "CLIENT2", Nom = "Agenda Client 2", Description = "Gestion des rendez-vous client de type 2", Icon = "👥" },
            new() { Id = "REFUS", Nom = "Agenda Refus", Description = "Gestion des rendez-vous refusés", Icon = "❌" },
            new() { Id = "EBI", Nom = "Agenda EBI", Description = "Gestion des rendez-vous de l'équipe EBI", Icon = "🏢" }
        };
        return Ok(agendas);
    }
}