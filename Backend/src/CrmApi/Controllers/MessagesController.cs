using CrmApi.DTOs.Message;
using CrmApi.Helpers;
using CrmApi.Services.Message;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService) => _messageService = messageService;

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        try { return Ok(await _messageService.GetConversationsAsync(UserContextHelper.GetUserId(User))); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("{otherUserId}")]
    public async Task<IActionResult> GetMessages(int otherUserId)
    {
        try { return Ok(await _messageService.GetMessagesAsync(UserContextHelper.GetUserId(User), otherUserId)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _messageService.SendMessageAsync(UserContextHelper.GetUserId(User), dto)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        try
        {
            var success = await _messageService.MarkAsReadAsync(messageId, UserContextHelper.GetUserId(User));
            if (!success) return NotFound(new { error = "Message not found" });
            return Ok(new { success });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
