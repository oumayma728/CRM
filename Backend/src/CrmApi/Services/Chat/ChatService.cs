using System.Text;
using System.Text.Json;
using CrmApi.Helpers;
using Microsoft.Extensions.Options;

namespace CrmApi.Services.Chat;

public class ChatService : IChatService
{
    private readonly OllamaSettings _ollamaSettings;
    private readonly HttpClient _httpClient;

    public ChatService(IOptions<OllamaSettings> ollamaSettings, IHttpClientFactory httpClientFactory)
    {
        _ollamaSettings = ollamaSettings.Value;
        _httpClient = httpClientFactory.CreateClient("Ollama");
        _httpClient.BaseAddress = new Uri(_ollamaSettings.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_ollamaSettings.Timeout);
    }

    public async Task<ChatResponseDto> SendMessageAsync(string message, int? userId, string? role, string? agentName)
    {
        try
        {
            var payload = new { model = _ollamaSettings.Model, prompt = $"Tu es un assistant CRM pour un centre d'appels.{(!string.IsNullOrEmpty(agentName) ? $" L'agent s'appelle {agentName}." : "")}\n\nQuestion: {message}\n\nRéponse:", stream = false, options = new { num_predict = _ollamaSettings.NumPredict, temperature = _ollamaSettings.Temperature } };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/api/generate", content);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                return new ChatResponseDto { Response = result.GetProperty("response").GetString() ?? "Pas de réponse", Sources = new List<string>() };
            }
        }
        catch { }
        return new ChatResponseDto { Response = "Je suis un assistant IA. Comment puis-je vous aider ?", Sources = new List<string>() };
    }

    public Task<object> GetHistoryAsync(int userId) => Task.FromResult<object>(new { history = new List<object>() });
}
