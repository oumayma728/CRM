using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Config;
using Microsoft.Extensions.Options;

namespace Backend.Services.Ai;

/// <summary>Single-prompt LLM completion used by <see cref="AiService"/> (summaries, 8-criteria script scoring).</summary>
public interface ILlmCompletionService
{
    /// <returns>The model's text, or null when no provider answered.</returns>
    Task<string?> CompleteAsync(string prompt, CancellationToken ct = default);
}

/// <summary>
/// Groq (cloud, configured via Groq:ApiKey — the feature/zied1 setup) is tried first; the local
/// Ollama instance (Ollama:* — the khaled-dev-v3 setup) is the fallback.
/// </summary>
public class LlmCompletionService : ILlmCompletionService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly OllamaSettings _ollama;
    private readonly ILogger<LlmCompletionService> _logger;

    public LlmCompletionService(IConfiguration config, IHttpClientFactory httpFactory, IOptions<OllamaSettings> ollama, ILogger<LlmCompletionService> logger)
    {
        _config = config;
        _httpFactory = httpFactory;
        _ollama = ollama.Value;
        _logger = logger;
    }

    public async Task<string?> CompleteAsync(string prompt, CancellationToken ct = default)
        => await TryGroqAsync(prompt, ct) ?? await TryOllamaAsync(prompt, ct);

    private async Task<string?> TryGroqAsync(string prompt, CancellationToken ct)
    {
        var apiKey = _config["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "VOTRE_CLE_API_GROQ") return null;
        try
        {
            using var client = _httpFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            var body = new
            {
                model = _config["Groq:Model"] ?? "openai/gpt-oss-120b",
                max_tokens = _config.GetValue("Groq:MaxTokens", 1024),
                temperature = 0.3,
                messages = new[] { new { role = "user", content = prompt } },
            };
            var resp = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"), ct);
            if (!resp.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groq completion failed, falling back to Ollama");
            return null;
        }
    }

    private async Task<string?> TryOllamaAsync(string prompt, CancellationToken ct)
    {
        try
        {
            using var client = _httpFactory.CreateClient("Ollama");
            client.BaseAddress = new Uri(_ollama.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(_ollama.Timeout);
            var payload = new
            {
                model = _ollama.Model,
                prompt,
                stream = false,
                options = new { num_predict = _ollama.NumPredict, temperature = _ollama.Temperature },
            };
            var resp = await client.PostAsync("/api/generate",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"), ct);
            if (!resp.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            return doc.RootElement.GetProperty("response").GetString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ollama completion failed");
            return null;
        }
    }
}
