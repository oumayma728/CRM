using CrmApi.Controllers;
using CrmApi.Services.Chat;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class ChatControllerTests : ControllerTestBase
{
    private readonly Mock<IChatService> _mockService;
    private readonly ChatController _sut;
    private readonly ChatController _authController;

    public ChatControllerTests()
    {
        _mockService = new Mock<IChatService>(MockBehavior.Strict);
        _sut = new ChatController(_mockService.Object);
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _authController = new ChatController(_mockService.Object);
        _authController.ControllerContext = CreateControllerContext(role: "admin");
    }

    [Fact]
    public async Task SendMessage_Valid_ReturnsOk()
    {
        var dto = new ChatRequest { Message = "Hello", Role = "agent" };
        var response = new ChatResponseDto { Response = "Hi there" };
        _mockService.Setup(s => s.SendMessageAsync("Hello", 1, "agent", null)).ReturnsAsync(response);

        var result = await _sut.SendMessage(dto);

        var val = OkValue<ChatResponseDto>(result);
        val.Response.Should().Be("Hi there");
    }

    [Fact]
    public async Task SendMessage_NullMessage_ReturnsBadRequest()
    {
        var result = await _sut.SendMessage(new ChatRequest { Message = "" });

        AssertBadRequest(result);
    }

    [Fact]
    public async Task SendMessage_NullBody_ReturnsBadRequest()
    {
        var result = await _sut.SendMessage(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk()
    {
        var expected = new List<ChatResponseDto> { new() { Response = "msg" } };
        _mockService.Setup(s => s.GetHistoryAsync(1)).ReturnsAsync(expected);

        var result = await _authController.GetHistory();

        var val = OkValue<List<ChatResponseDto>>(result);
        val.Should().ContainSingle();
    }
}
