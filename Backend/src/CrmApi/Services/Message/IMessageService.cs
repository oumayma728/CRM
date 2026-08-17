using CrmApi.DTOs.Message;

namespace CrmApi.Services.Message;

public interface IMessageService
{
    Task<List<ConversationDto>> GetConversationsAsync(int userId);
    Task<List<MessageDto>> GetMessagesAsync(int userId, int otherUserId);
    Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto);
    Task<bool> MarkAsReadAsync(int messageId, int userId);
}
