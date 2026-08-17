using System.Net.WebSockets;
using CrmApi.Services.WebSocket;
using FluentAssertions;

namespace CrmApi.Tests.WebSocket;

public class WebSocketConnectionManagerTests
{
    private readonly WebSocketConnectionManager _sut = new();

    [Fact]
    public void Add_NewConnection_StoresSocket()
    {
        using var ws = new MockWebSocket();
        _sut.Add(1, ws);

        _sut.TryGetConnection(1, out var stored).Should().BeTrue();
        stored.Should().Be(ws);
    }

    [Fact]
    public void Add_DuplicateConnection_Overwrites()
    {
        using var ws1 = new MockWebSocket();
        using var ws2 = new MockWebSocket();
        _sut.Add(1, ws1);
        _sut.Add(1, ws2);

        _sut.TryGetConnection(1, out var stored).Should().BeTrue();
        stored.Should().Be(ws2);
    }

    [Fact]
    public void Remove_ExistingConnection_Removes()
    {
        using var ws = new MockWebSocket();
        _sut.Add(1, ws);
        _sut.Remove(1);

        _sut.TryGetConnection(1, out _).Should().BeFalse();
    }

    [Fact]
    public void TryGetConnection_NonExistent_ReturnsFalse()
    {
        _sut.TryGetConnection(999, out _).Should().BeFalse();
    }

    [Fact]
    public void Get_ExistingUser_ReturnsSocket()
    {
        using var ws = new MockWebSocket();
        _sut.Add(1, ws);

        var result = _sut.Get(1);
        result.Should().NotBeNull();
        result.Should().Be(ws);
    }

    [Fact]
    public void Get_NonExistentUser_ReturnsNull()
    {
        var result = _sut.Get(999);
        result.Should().BeNull();
    }

    [Fact]
    public async Task RemoveAsync_ExistingConnection_Removes()
    {
        using var ws = new MockWebSocket();
        _sut.Add(1, ws);
        await _sut.RemoveAsync(1);

        _sut.TryGetConnection(1, out _).Should().BeFalse();
    }

    [Fact]
    public void SendAsync_ExistingSocket_SendsMessage()
    {
        using var ws = new MockWebSocket();
        _sut.Add(1, ws);

        var task = _sut.SendAsync(1, "test message");
        task.IsCompletedSuccessfully.Should().BeTrue();
    }

    [Fact]
    public void SendAsync_NonExistentSocket_DoesNotThrow()
    {
        var task = _sut.SendAsync(999, "test");
        task.IsCompletedSuccessfully.Should().BeTrue();
    }

    private class MockWebSocket : System.Net.WebSockets.WebSocket
    {
        public override WebSocketState State { get; } = WebSocketState.Open;
        public override WebSocketCloseStatus? CloseStatus => null;
        public override string? CloseStatusDescription => null;
        public override string? SubProtocol => null;

        public override void Abort() { }
        public override Task CloseAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
            => Task.CompletedTask;
        public override Task CloseOutputAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
            => Task.CompletedTask;
        public override void Dispose() { }
        public override Task<WebSocketReceiveResult> ReceiveAsync(ArraySegment<byte> buffer, CancellationToken cancellationToken)
            => Task.FromResult(new WebSocketReceiveResult(0, WebSocketMessageType.Text, true));
        public override Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType messageType, bool endOfMessage, CancellationToken cancellationToken)
            => Task.CompletedTask;
    }
}
