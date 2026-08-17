using CrmApi.Data;
using CrmApi.DTOs.Message;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Message;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class MessageServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly MessageService _sut;

    public MessageServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_msg_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _mockUow = new Mock<IUnitOfWork>();
        _sut = new MessageService(_context, _mockUow.Object);
    }

    [Fact]
    public async Task SendMessageAsync_ValidDto_SavesAndReturnsDto()
    {
        var sender = new User { Id = 1, Username = "alice", Name = "Alice", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        var receiver = new User { Id = 2, Username = "bob", Name = "Bob", Role = UserRole.Agent, Password = "hash", Email = "b@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.AddRange(sender, receiver);
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
        var currentUser = new User { Id = 1, Username = "me", Name = "Me", Role = UserRole.Agent, Password = "hash", Email = "me@b.com", CreatedAt = DateTime.UtcNow };
        var other1 = new User { Id = 2, Username = "other1", Name = "Other 1", Role = UserRole.Agent, Password = "hash", Email = "o1@b.com", CreatedAt = DateTime.UtcNow };
        var other2 = new User { Id = 3, Username = "other2", Name = "Other 2", Role = UserRole.Qualite, Password = "hash", Email = "o2@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.AddRange(currentUser, other1, other2);
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
        var current = new User { Id = 1, Username = "u1", Name = "U1", Role = UserRole.Agent, Password = "hash", Email = "u1@b.com", CreatedAt = DateTime.UtcNow };
        var other = new User { Id = 2, Username = "u2", Name = "U2", Role = UserRole.Agent, Password = "hash", Email = "u2@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.AddRange(current, other);
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
        var sender = new User { Id = 1, Username = "alice", Name = "Alice", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        var receiver = new User { Id = 2, Username = "bob", Name = "Bob", Role = UserRole.Agent, Password = "hash", Email = "b@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.AddRange(sender, receiver);
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
