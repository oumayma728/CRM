using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs.Message;
using Backend.Services.Message;

namespace Backend.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService) => _messageService = messageService;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        try { return Ok(await _messageService.GetConversationsAsync(GetUserId())); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("{otherUserId}")]
    public async Task<IActionResult> GetMessages(int otherUserId)
    {
        try { return Ok(await _messageService.GetMessagesAsync(GetUserId(), otherUserId)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _messageService.SendMessageAsync(GetUserId(), dto)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        try
        {
            var success = await _messageService.MarkAsReadAsync(messageId, GetUserId());
            if (!success) return NotFound(new { error = "Message not found" });
            return Ok(new { success });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
