using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs.Agent;
using Backend.Entities;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Récupère tous les contacts</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ContactDTO>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var contacts = await _context.Contacts
            .Include(c => c.Agent)
            .OrderByDescending(c => c.DateImport)
            .AsNoTracking()
            .ToListAsync();

        var result = contacts.Select(c => new ContactDTO
        {
            Id = c.Id,
            Nom = c.Nom,
            Prenom = c.Prenom,
            Telephone = c.Telephone,
            Email = c.Email,
            Adresse = c.Adresse,
            Source = c.Source,
            Statut = c.Statut,
            AgentId = c.AgentId,
            AgentNom = c.Agent != null ? $"{c.Agent.Prenom} {c.Agent.Nom}" : null,  
            DateRappelPlanifie = c.DateRappelPlanifie
        });

        return Ok(result);
    }

    /// <summary>Récupère un contact par son ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ContactDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(long id)
    {
        var contact = await _context.Contacts
            .Include(c => c.Agent)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact == null)
            return NotFound(new { message = $"Contact {id} introuvable." });

        var result = new ContactDTO
        {
            Id = contact.Id,
            Nom = contact.Nom,
            Prenom = contact.Prenom,
            Telephone = contact.Telephone,
            Email = contact.Email,
            Adresse = contact.Adresse,
            Source = contact.Source,
            Statut = contact.Statut,
            AgentId = contact.AgentId,
            AgentNom = contact.Agent != null ? $"{contact.Agent.Prenom} {contact.Agent.Nom}" : null,
            DateRappelPlanifie = contact.DateRappelPlanifie
        };

        return Ok(result);
    }

    /// <summary>Crée un nouveau contact</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ContactDTO), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreateContactDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var contact = new Contact
        {
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Telephone = dto.Telephone,
            Email = dto.Email,
            Adresse = dto.Adresse,
            Source = dto.Source,
            Statut = "A_APPELER",
            DateImport = DateTime.UtcNow
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();

        var result = new ContactDTO
        {
            Id = contact.Id,
            Nom = contact.Nom,
            Prenom = contact.Prenom,
            Telephone = contact.Telephone,
            Email = contact.Email,
            Adresse = contact.Adresse,
            Source = contact.Source,
            Statut = contact.Statut,
            AgentId = contact.AgentId
        };

        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, result);
    }

    /// <summary>Met à jour un contact</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ContactDTO), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(long id, [FromBody] CreateContactDTO dto)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null)
            return NotFound(new { message = $"Contact {id} introuvable." });

        contact.Nom = dto.Nom ?? contact.Nom;
        contact.Prenom = dto.Prenom ?? contact.Prenom;
        contact.Telephone = dto.Telephone;
        contact.Email = dto.Email ?? contact.Email;
        contact.Adresse = dto.Adresse ?? contact.Adresse;
        contact.Source = dto.Source;

        await _context.SaveChangesAsync();

        var result = new ContactDTO
        {
            Id = contact.Id,
            Nom = contact.Nom,
            Prenom = contact.Prenom,
            Telephone = contact.Telephone,
            Email = contact.Email,
            Adresse = contact.Adresse,
            Source = contact.Source,
            Statut = contact.Statut,
            AgentId = contact.AgentId
        };

        return Ok(result);
    }

    /// <summary>Supprime un contact</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(long id)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null)
            return NotFound(new { message = $"Contact {id} introuvable." });

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Récupère les contacts à appeler pour un agent</summary>
    [HttpGet("agent/{agentId:long}/a-appeler")]
    [ProducesResponseType(typeof(IEnumerable<ContactDTO>), 200)]
    public async Task<IActionResult> GetContactsAApeler(long agentId)
    {
        var contacts = await _context.Contacts
            .Where(c => c.AgentId == agentId && c.Statut == "A_APPELER")
            .OrderBy(c => c.DateImport)
            .AsNoTracking()
            .ToListAsync();

        var result = contacts.Select(c => new ContactDTO
        {
            Id = c.Id,
            Nom = c.Nom,
            Prenom = c.Prenom,
            Telephone = c.Telephone,
            Email = c.Email,
            Adresse = c.Adresse,
            Source = c.Source,
            Statut = c.Statut,
            AgentId = c.AgentId
        });

        return Ok(result);
    }
}