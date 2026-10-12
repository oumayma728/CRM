using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Helpers;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ChatController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string Role => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

    /// <summary>Récupérer l'historique d'un canal (50 derniers messages). Réservé à ceux qui peuvent LIRE ce canal.</summary>
    [HttpGet("{channel}")]
    public async Task<IActionResult> GetHistory(string channel, [FromQuery] int limit = 50)
    {
        var id = ChatChannels.Normalize(channel);
        if (id == null) return NotFound(new { message = "Canal inconnu." });
        var confType = await ChatChannels.ConfirmatriceTypeAsync(_context, Role, UserContextHelper.GetUserId(User));
        if (!ChatChannels.CanRead(Role, confType, id))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Vous n'avez pas accès à ce canal." });

        var messages = await _context.ChatMessages
            .Where(m => m.Channel == id)
            .OrderByDescending(m => m.SentAt)
            .Take(Math.Min(limit, 200))
            .OrderBy(m => m.SentAt)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                m.SenderName,
                m.SenderRole,
                m.Content,
                m.Channel,
                SentAt = m.SentAt.ToString("o"),
            })
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>
    /// Canaux que l'utilisateur peut utiliser, avec ses droits : canRead (lire l'historique et recevoir en direct)
    /// et canWrite (envoyer). Un canal peut être en écriture seule : on peut écrire au groupe d'un autre rôle sans le lire.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetChannels()
    {
        var role = Role;
        var confType = await ChatChannels.ConfirmatriceTypeAsync(_context, role, UserContextHelper.GetUserId(User));
        return Ok(ChatChannels.All
            .Select(c => new
            {
                id = c.Id, label = c.Label,
                canRead = ChatChannels.CanRead(role, confType, c.Id),
                canWrite = ChatChannels.CanWrite(role, confType, c.Id),
            })
            .Where(c => c.canRead || c.canWrite)
            .ToList());
    }
}
