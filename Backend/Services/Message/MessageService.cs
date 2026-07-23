using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs.Message;
using Backend.Entities;

namespace Backend.Services.Message;

public class MessageService : IMessageService
{
    private readonly ApplicationDbContext _context;

    public MessageService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ConversationDto>> GetConversationsAsync(int userId)
    {
        var users = await _context.Users.AsNoTracking().Where(u => u.Id != userId).ToListAsync();
        var result = new List<ConversationDto>();
        foreach (var u in users)
        {
            var lastMsg = await _context.Set<Backend.Entities.Message>()
                .AsNoTracking()
                .Where(m => (m.SenderId == userId && m.ReceiverId == u.Id) || (m.SenderId == u.Id && m.ReceiverId == userId))
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();
            var unread = await _context.Set<Backend.Entities.Message>()
                .AsNoTracking()
                .CountAsync(m => m.SenderId == u.Id && m.ReceiverId == userId && !m.IsRead);
            result.Add(new ConversationDto
            {
                UserId = u.Id,
                UserName = $"{u.FirstName} {u.LastName}".Trim(),
                UserRole = u.Role?.Name?.ToLower(),
                LastMessage = lastMsg?.Content,
                LastMessageTime = lastMsg?.CreatedAt,
                UnreadCount = unread,
                IsOnline = u.IsOnline
            });
        }
        return result.OrderByDescending(c => c.LastMessageTime).ToList();
    }

    public async Task<List<MessageDto>> GetMessagesAsync(int userId, int otherUserId)
    {
        return await _context.Set<Backend.Entities.Message>()
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) || (m.SenderId == otherUserId && m.ReceiverId == userId))
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender != null ? $"{m.Sender.FirstName} {m.Sender.LastName}".Trim() : "",
                ReceiverId = m.ReceiverId,
                ReceiverName = m.Receiver != null ? $"{m.Receiver.FirstName} {m.Receiver.LastName}".Trim() : "",
                Content = m.Content,
                IsUrgent = m.IsUrgent,
                IsRead = m.IsRead,
                CreatedAt = m.CreatedAt,
                ReadAt = m.ReadAt
            })
            .ToListAsync();
    }

    public async Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto)
    {
        var msg = new Backend.Entities.Message
        {
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            Content = dto.Content,
            IsUrgent = dto.IsUrgent
        };
        _context.Set<Backend.Entities.Message>().Add(msg);
        await _context.SaveChangesAsync();
        var saved = await _context.Set<Backend.Entities.Message>()
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .FirstAsync(m => m.Id == msg.Id);
        return new MessageDto
        {
            Id = saved.Id,
            SenderId = saved.SenderId,
            SenderName = saved.Sender != null ? $"{saved.Sender.FirstName} {saved.Sender.LastName}".Trim() : "",
            ReceiverId = saved.ReceiverId,
            ReceiverName = saved.Receiver != null ? $"{saved.Receiver.FirstName} {saved.Receiver.LastName}".Trim() : "",
            Content = saved.Content,
            IsUrgent = saved.IsUrgent,
            IsRead = saved.IsRead,
            CreatedAt = saved.CreatedAt,
            ReadAt = saved.ReadAt
        };
    }

    public async Task<bool> MarkAsReadAsync(int messageId, int userId)
    {
        var msg = await _context.Set<Backend.Entities.Message>()
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == userId);
        if (msg == null) return false;
        msg.IsRead = true;
        msg.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
