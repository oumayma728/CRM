using CrmApi.Controllers;
using CrmApi.DTOs.Message;
using CrmApi.Services.Message;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class MessagesControllerTests : ControllerTestBase
{
    private readonly Mock<IMessageService> _mockService;
    private readonly MessagesController _sut;

    public MessagesControllerTests()
    {
        _mockService = new Mock<IMessageService>(MockBehavior.Strict);
        _sut = new MessagesController(_mockService.Object);
    }

    [Fact]
    public async Task GetConversations_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new List<ConversationDto> { new() { UserId = 2, UserName = "Bob", UnreadCount = 3 } };
        _mockService.Setup(s => s.GetConversationsAsync(1)).ReturnsAsync(expected);

        var result = await _sut.GetConversations();

        var val = OkValue<List<ConversationDto>>(result);
        val.Should().ContainSingle();
        val[0].UserName.Should().Be("Bob");
    }

    [Fact]
    public async Task GetMessages_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new List<MessageDto> { new() { Content = "Hello", SenderId = 1, ReceiverId = 2 } };
        _mockService.Setup(s => s.GetMessagesAsync(1, 2)).ReturnsAsync(expected);

        var result = await _sut.GetMessages(2);

        var val = OkValue<List<MessageDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task SendMessage_Valid_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var dto = new SendMessageDto { ReceiverId = 2, Content = "Hi!" };
        var expected = new MessageDto { Content = "Hi!", SenderId = 1, ReceiverId = 2 };
        _mockService.Setup(s => s.SendMessageAsync(1, dto)).ReturnsAsync(expected);

        var result = await _sut.SendMessage(dto);

        var val = OkValue<MessageDto>(result);
        val.Content.Should().Be("Hi!");
    }

    [Fact]
    public async Task SendMessage_NullBody_ReturnsBadRequest()
    {
        var result = await _sut.SendMessage(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task MarkAsRead_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        _mockService.Setup(s => s.MarkAsReadAsync(1, 1)).ReturnsAsync(true);

        var result = await _sut.MarkAsRead(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task MarkAsRead_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        _mockService.Setup(s => s.MarkAsReadAsync(999, 1)).ReturnsAsync(false);

        var result = await _sut.MarkAsRead(999);

        AssertNotFound(result);
    }
}
