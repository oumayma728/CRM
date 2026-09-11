using System.Net;
using System.Text;
using System.Text.Json;
using CrmApi.Helpers;
using CrmApi.Services.Chat;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace CrmApi.Tests;

public class ChatServiceTests
{
    private readonly ChatService _sut;
    private FakeHttpMessageHandler _handler;

    public ChatServiceTests()
    {
        _handler = new FakeHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.OK));
        var httpClient = new HttpClient(_handler)
        {
            BaseAddress = new Uri("http://localhost:11434")
        };
        var httpFactory = new FakeHttpClientFactory(httpClient);
        var options = Microsoft.Extensions.Options.Options.Create(new OllamaSettings
        {
            BaseUrl = "http://localhost:11434",
            Model = "gemma3:4b",
            Timeout = 30,
            NumPredict = 512,
            Temperature = 0.3f
        });
        var logger = new Mock<ILogger<ChatService>>();
        _sut = new ChatService(options, httpFactory, logger.Object);
    }

    [Fact]
    public async Task SendMessageAsync_OllamaSuccess_ReturnsResponse()
    {
        var responseJson = JsonSerializer.Serialize(new { response = "Bonjour! Comment puis-je vous aider?" });
        _handler.Response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
        };

        var result = await _sut.SendMessageAsync("Bonjour", userId: 1, role: "agent", agentName: "Jean");

        result.Response.Should().Be("Bonjour! Comment puis-je vous aider?");
    }

    [Fact]
    public async Task SendMessageAsync_OllamaFails_ReturnsFallback()
    {
        _handler.Response = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);

        var result = await _sut.SendMessageAsync("test", userId: null, role: null, agentName: null);

        result.Response.Should().Contain("service IA");
    }

    [Fact]
    public async Task SendMessageAsync_HttpThrows_ReturnsFallback()
    {
        _handler.Exception = new HttpRequestException("Network error");

        var result = await _sut.SendMessageAsync("test", userId: null, role: null, agentName: null);

        result.Response.Should().Contain("service IA");
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsEmptyHistory()
    {
        var result = await _sut.GetHistoryAsync(1);

        result.Should().NotBeNull();
    }

    private class FakeHttpMessageHandler : HttpMessageHandler
    {
        public HttpResponseMessage? Response { get; set; }
        public Exception? Exception { get; set; }

        public FakeHttpMessageHandler(HttpResponseMessage response) { Response = response; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (Exception != null) throw Exception;
            return Task.FromResult(Response!);
        }
    }

    private class FakeHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpClient _client;
        public FakeHttpClientFactory(HttpClient client) { _client = client; }
        public HttpClient CreateClient(string name) => _client;
    }
}
