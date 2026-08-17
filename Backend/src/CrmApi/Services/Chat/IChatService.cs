namespace CrmApi.Services.Chat;

public interface IChatService
{
    Task<ChatResponseDto> SendMessageAsync(string message, int? userId, string? role, string? agentName);
    Task<object> GetHistoryAsync(int userId);
}

public class ChatResponseDto
{
    public string Response { get; set; } = string.Empty;
    public List<string> Sources { get; set; } = new();
}
