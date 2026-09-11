using System.Text;
using System.Text.Json;
using CrmApi.Helpers;
using Microsoft.Extensions.Options;

namespace CrmApi.Services.Chat;

public class ChatService : IChatService
{
    private readonly OllamaSettings _ollamaSettings;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ChatService> _logger;
    private const int MaxRetries = 3;
    private static readonly TimeSpan BaseDelay = TimeSpan.FromSeconds(2);

    public ChatService(IOptions<OllamaSettings> ollamaSettings, IHttpClientFactory httpClientFactory, ILogger<ChatService> logger)
    {
        _ollamaSettings = ollamaSettings.Value;
        _httpClient = httpClientFactory.CreateClient("Ollama");
        _httpClient.BaseAddress = new Uri(_ollamaSettings.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_ollamaSettings.Timeout);
        _logger = logger;
    }

    public async Task<ChatResponseDto> SendMessageAsync(string message, int? userId, string? role, string? agentName)
    {
        for (int attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var payload = new
                {
                    model = _ollamaSettings.Model,
                    prompt = $"Tu es un assistant CRM pour un centre d'appels.{(!string.IsNullOrEmpty(agentName) ? $" L'agent s'appelle {agentName}." : "")}\n\nQuestion: {message}\n\nRéponse:",
                    stream = false,
                    options = new
                    {
                        num_predict = _ollamaSettings.NumPredict,
                        temperature = _ollamaSettings.Temperature
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("/api/generate", content);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    var responseText = result.GetProperty("response").GetString();

                    if (!string.IsNullOrWhiteSpace(responseText))
                    {
                        return new ChatResponseDto
                        {
                            Response = responseText,
                            Sources = new List<string>()
                        };
                    }
                }

                _logger.LogWarning("Ollama attempt {Attempt}/{MaxRetries} failed with status {StatusCode}",
                    attempt, MaxRetries, response.StatusCode);
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("Ollama attempt {Attempt}/{MaxRetries} timed out", attempt, MaxRetries);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "Ollama attempt {Attempt}/{MaxRetries} connection error", attempt, MaxRetries);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Ollama attempt {Attempt}/{MaxRetries} invalid JSON response", attempt, MaxRetries);
                return new ChatResponseDto
                {
                    Response = "Réponse IA non valide. Veuillez réessayer.",
                    Sources = new List<string>()
                };
            }

            if (attempt < MaxRetries)
            {
                var delay = BaseDelay * Math.Pow(2, attempt - 1);
                _logger.LogInformation("Retrying Ollama in {Delay}s (attempt {Attempt}/{MaxRetries})",
                    delay.TotalSeconds, attempt + 1, MaxRetries);
                await Task.Delay(delay);
            }
        }

        _logger.LogError("Ollama unavailable after {MaxRetries} attempts. Falling back.", MaxRetries);
        return new ChatResponseDto
        {
            Response = "Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.",
            Sources = new List<string>()
        };
    }

    public Task<object> GetHistoryAsync(int userId) => Task.FromResult<object>(new { history = new List<object>() });
}
