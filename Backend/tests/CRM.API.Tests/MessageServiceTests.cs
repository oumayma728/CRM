using Backend.Data;
using Backend.DTOs.Messages;
using Backend.Entities;
using Backend.Services.Messages;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CRM.API.Tests;

public class MessageServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly MessageService _sut;

    public MessageServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_msg_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _sut = new MessageService(_context);
    }

    [Fact]
    public async Task SendMessageAsync_ValidDto_SavesAndReturnsDto()
    {
        var sender = new Agent { Id = 1, Prenom = "Alice", Nom = "", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        var receiver = new Agent { Id = 2, Prenom = "Bob", Nom = "", Email = "b@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.AddRange(sender, receiver);
        await _context.SaveChangesAsync();

        var dto = new SendMessageDto { ReceiverId = 2, Content = "Hello Bob!", IsUrgent = true };
        var result = await _sut.SendMessageAsync(senderId: 1, dto);

        result.Content.Should().Be("Hello Bob!");
        result.SenderId.Should().Be(1);
        result.ReceiverId.Should().Be(2);
        result.SenderName.Should().Be("Alice");
        result.ReceiverName.Should().Be("Bob");
        result.IsUrgent.Should().BeTrue();
        result.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task GetConversationsAsync_ReturnsOrderedByLastMessage()
    {
        var currentUser = new Agent { Id = 1, Prenom = "Me", Nom = "", Email = "me@b.com", MotDePasse = "hash", Role = "AGENT" };
        var other1 = new Agent { Id = 2, Prenom = "Other", Nom = "1", Email = "o1@b.com", MotDePasse = "hash", Role = "AGENT" };
        var other2 = new Qualite { Id = 3, Prenom = "Other", Nom = "2", Email = "o2@b.com", MotDePasse = "hash", Role = "QUALITE" };
        _context.Utilisateurs.AddRange(currentUser, other1, other2);
        _context.Messages.AddRange(
            new Message { SenderId = 2, ReceiverId = 1, Content = "Hello from other1", CreatedAt = DateTime.UtcNow.AddMinutes(-5) },
            new Message { SenderId = 3, ReceiverId = 1, Content = "Hello from other2", CreatedAt = DateTime.UtcNow.AddMinutes(-1) }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetConversationsAsync(1);

        result.Should().HaveCount(2);
        result[0].UserId.Should().Be(3);
        result[0].LastMessage.Should().Be("Hello from other2");
        result[1].UserId.Should().Be(2);
    }

    [Fact]
    public async Task GetConversationsAsync_WithUnread_IncludesCount()
    {
        var current = new Agent { Id = 1, Prenom = "U1", Nom = "", Email = "u1@b.com", MotDePasse = "hash", Role = "AGENT" };
        var other = new Agent { Id = 2, Prenom = "U2", Nom = "", Email = "u2@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.AddRange(current, other);
        _context.Messages.AddRange(
            new Message { SenderId = 2, ReceiverId = 1, Content = "Unread 1", IsRead = false, CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
            new Message { SenderId = 2, ReceiverId = 1, Content = "Unread 2", IsRead = false, CreatedAt = DateTime.UtcNow.AddMinutes(-5) }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetConversationsAsync(1);

        var conv = result.Should().ContainSingle().Subject;
        conv.UnreadCount.Should().Be(2);
    }

    [Fact]
    public async Task GetMessagesAsync_ReturnsOrderedChat()
    {
        var sender = new Agent { Id = 1, Prenom = "Alice", Nom = "", Email = "a@b.com", MotDePasse = "hash", Role = "AGENT" };
        var receiver = new Agent { Id = 2, Prenom = "Bob", Nom = "", Email = "b@b.com", MotDePasse = "hash", Role = "AGENT" };
        _context.Utilisateurs.AddRange(sender, receiver);
        _context.Messages.AddRange(
            new Message { SenderId = 1, ReceiverId = 2, Content = "Msg 1", CreatedAt = DateTime.UtcNow.AddMinutes(-5) },
            new Message { SenderId = 2, ReceiverId = 1, Content = "Reply 1", CreatedAt = DateTime.UtcNow.AddMinutes(-4) },
            new Message { SenderId = 1, ReceiverId = 2, Content = "Msg 2", CreatedAt = DateTime.UtcNow.AddMinutes(-3) }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetMessagesAsync(1, 2);

        result.Should().HaveCount(3);
        result[0].Content.Should().Be("Msg 1");
        result[1].Content.Should().Be("Reply 1");
        result[2].Content.Should().Be("Msg 2");
    }

    [Fact]
    public async Task MarkAsReadAsync_OwnMessage_ReturnsTrue()
    {
        var msg = new Message { SenderId = 2, ReceiverId = 1, Content = "Test", IsRead = false, CreatedAt = DateTime.UtcNow };
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        var result = await _sut.MarkAsReadAsync(msg.Id, userId: 1);

        result.Should().BeTrue();
        var updated = await _context.Messages.FindAsync(msg.Id);
        updated!.IsRead.Should().BeTrue();
        updated.ReadAt.Should().NotBeNull();
    }

    [Fact]
    public async Task MarkAsReadAsync_NotOwnMessage_ReturnsFalse()
    {
        var msg = new Message { SenderId = 1, ReceiverId = 2, Content = "Test", IsRead = false, CreatedAt = DateTime.UtcNow };
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        var result = await _sut.MarkAsReadAsync(msg.Id, userId: 3);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task MarkAsReadAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.MarkAsReadAsync(999, userId: 1);

        result.Should().BeFalse();
    }
}
