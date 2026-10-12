using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;

namespace Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    private string Role => Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? Context.User?.FindFirst("role")?.Value ?? "";

    /// <summary>Envoyer un message dans un canal (règles d'écriture : voir <see cref="ChatChannels"/>)</summary>
    public async Task SendMessage(string channel, string content)
    {
        var channelId = ChatChannels.Normalize(channel) ?? throw new HubException("Canal inconnu.");
        var confType = await ChatChannels.ConfirmatriceTypeAsync(_context, Role, UserContextHelper.GetUserId(Context.User!));
        if (!ChatChannels.CanWrite(Role, confType, channelId))
            throw new HubException(ChatChannels.WriteRefusedMessage(Role, confType, channelId));
        var text = (content ?? "").Trim();
        if (text.Length == 0) throw new HubException("Le message est vide.");
        if (text.Length > ChatChannels.MaxMessageLength)
            throw new HubException($"Message trop long (maximum {ChatChannels.MaxMessageLength} caractères).");

        var userId   = long.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? Context.User!.FindFirst("sub")?.Value ?? "0");
        var name     = Context.User!.FindFirst("name")?.Value
                        ?? Context.User!.FindFirst(ClaimTypes.Name)?.Value ?? "Inconnu";
        var role     = Context.User!.FindFirst(ClaimTypes.Role)?.Value
                        ?? Context.User!.FindFirst("role")?.Value ?? "";

        var msg = new ChatMessage
        {
            SenderId   = userId,
            SenderName = name,
            SenderRole = role,
            Content    = text,
            Channel    = channelId,
            SentAt     = DateTime.UtcNow,
        };

        _context.ChatMessages.Add(msg);
        await _context.SaveChangesAsync();

        var payload = new
        {
            msg.Id,
            msg.SenderId,
            msg.SenderName,
            msg.SenderRole,
            msg.Content,
            msg.Channel,
            SentAt = msg.SentAt.ToString("o"),
        };
        // the readers of the channel receive it live...
        await Clients.GroupExcept(channelId, new[] { Context.ConnectionId }).SendAsync("ReceiveMessage", payload);
        // ...and the sender always gets his own message back (he may write to a group he cannot read, e.g. an agent writing to Qualité)
        await Clients.Caller.SendAsync("ReceiveMessage", payload);
    }

    /// <summary>Rejoindre un canal de discussion</summary>
    public async Task JoinChannel(string channel)
    {
        var channelId = ChatChannels.Normalize(channel) ?? throw new HubException("Canal inconnu.");
        var confType = await ChatChannels.ConfirmatriceTypeAsync(_context, Role, UserContextHelper.GetUserId(Context.User!));
        if (!ChatChannels.CanRead(Role, confType, channelId))
            throw new HubException("Vous n'avez pas accès à ce canal.");
        await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        await Clients.Caller.SendAsync("JoinedChannel", channelId);
    }

    /// <summary>Quitter un canal</summary>
    public async Task LeaveChannel(string channel)
    {
        var channelId = ChatChannels.Normalize(channel);
        if (channelId != null) await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
    }
}
