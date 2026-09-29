namespace Backend.DTOs.Messages;

public class SendMessageDto
{
    public long ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsUrgent { get; set; }
}

public class MessageDto
{
    public int Id { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public long ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsUrgent { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class ConversationDto
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserRole { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}
