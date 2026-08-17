using CrmApi.Data;
using CrmApi.DTOs.Message;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Message;

public class MessageService : IMessageService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public MessageService(ApplicationDbContext context, IUnitOfWork uow) { _context = context; _uow = uow; }

    public async Task<List<ConversationDto>> GetConversationsAsync(int userId)
    {
        var users = await _context.Users.AsNoTracking().Where(u => u.Id != userId).ToListAsync();
        var result = new List<ConversationDto>();
        foreach (var u in users)
        {
            var lastMsg = await _context.Messages.AsNoTracking().Where(m => (m.SenderId == userId && m.ReceiverId == u.Id) || (m.SenderId == u.Id && m.ReceiverId == userId)).OrderByDescending(m => m.CreatedAt).FirstOrDefaultAsync();
            var unread = await _context.Messages.AsNoTracking().CountAsync(m => m.SenderId == u.Id && m.ReceiverId == userId && !m.IsRead);
            result.Add(new ConversationDto { UserId = u.Id, UserName = u.Name, UserRole = u.Role.ToString().ToLower(), LastMessage = lastMsg?.Content, LastMessageTime = lastMsg?.CreatedAt, UnreadCount = unread });
        }
        return result.OrderByDescending(c => c.LastMessageTime).ToList();
    }

    public async Task<List<MessageDto>> GetMessagesAsync(int userId, int otherUserId)
    {
        return await _context.Messages.AsNoTracking().Include(m => m.Sender).Include(m => m.Receiver)
            .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) || (m.SenderId == otherUserId && m.ReceiverId == userId))
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto { Id = m.Id, SenderId = m.SenderId, SenderName = m.Sender != null ? m.Sender.Name : "", ReceiverId = m.ReceiverId, ReceiverName = m.Receiver != null ? m.Receiver.Name : "", Content = m.Content, IsUrgent = m.IsUrgent, IsRead = m.IsRead, CreatedAt = m.CreatedAt, ReadAt = m.ReadAt })
            .ToListAsync();
    }

    public async Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto)
    {
        var msg = new Models.Entities.Message { SenderId = senderId, ReceiverId = dto.ReceiverId, Content = dto.Content, IsUrgent = dto.IsUrgent };
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();
        var saved = await _context.Messages.AsNoTracking().Include(m => m.Sender).Include(m => m.Receiver).FirstAsync(m => m.Id == msg.Id);
        return new MessageDto { Id = saved.Id, SenderId = saved.SenderId, SenderName = saved.Sender?.Name ?? "", ReceiverId = saved.ReceiverId, ReceiverName = saved.Receiver?.Name ?? "", Content = saved.Content, IsUrgent = saved.IsUrgent, IsRead = saved.IsRead, CreatedAt = saved.CreatedAt, ReadAt = saved.ReadAt };
    }

    public async Task<bool> MarkAsReadAsync(int messageId, int userId)
    {
        var msg = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == userId);
        if (msg == null) return false;
        msg.IsRead = true; msg.ReadAt = DateTime.UtcNow;
        _context.Messages.Update(msg);
        await _context.SaveChangesAsync();
        return true;
    }
}
