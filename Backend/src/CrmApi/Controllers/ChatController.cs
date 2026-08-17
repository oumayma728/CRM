using CrmApi.Helpers;
using CrmApi.Services.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService) => _chatService = chatService;

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] ChatRequest dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Message)) return BadRequest(new { error = "Message is required" });
        try
        {
            var userId = User.Identity?.IsAuthenticated == true ? UserContextHelper.GetUserId(User) : (int?)null;
            return Ok(await _chatService.SendMessageAsync(dto.Message, userId, dto.Role, dto.AgentName));
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<IActionResult> GetHistory()
    {
        try { return Ok(await _chatService.GetHistoryAsync(UserContextHelper.GetUserId(User))); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string? Role { get; set; } = "agent";
    public string? AgentName { get; set; }
}
