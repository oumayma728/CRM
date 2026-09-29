using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.DTOs.Ai;

namespace Backend.Services.Ai;

public class GroqAiService : IGroqAiService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<GroqAiService> _logger;

    public GroqAiService(IConfiguration config, IHttpClientFactory httpFactory, ILogger<GroqAiService> logger)
    {
        _config = config;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    private string? ApiKey => _config["Groq:ApiKey"] is string k && k != "VOTRE_CLE_API_GROQ" ? k : null;
    private string ChatModel => _config["Groq:Model"] ?? "openai/gpt-oss-120b";
    private string TranscriptionModel => _config["Groq:TranscriptionModel"] ?? "whisper-large-v3-turbo";

    // ── Résumé + mots-clés ────────────────────────────────────────────────────
    public async Task<SummarizeResultDto?> SummarizeAsync(string transcript, string? agentName)
    {
        var apiKey = ApiKey;
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrWhiteSpace(transcript)) return null;

        var agentContext = !string.IsNullOrEmpty(agentName) ? $"L'agent s'appelle {agentName}. " : "";
        var prompt =
            $"Voici la transcription d'un appel téléphonique commercial. {agentContext}" +
            "Résume cet appel en 2-3 phrases en français, puis liste 5-8 mots-clés séparés par des virgules.\n\n" +
            $"Transcription:\n{transcript}\n\n" +
            "Réponds UNIQUEMENT avec ce format exact (sans autre texte) :\n" +
            "RÉSUMÉ: <résumé>\nMOTS-CLÉS: <mot1, mot2, ...>";

        var raw = await CompleteAsync(apiKey, prompt, maxTokens: 500);
        if (raw == null) return null;

        var summary = raw;
        var keywords = "";

        var summaryMatch = Regex.Match(raw, @"RÉSUMÉ:\s*(.+?)(?=\nMOTS-CLÉS:|$)", RegexOptions.Singleline);
        if (summaryMatch.Success) summary = summaryMatch.Groups[1].Value.Trim();

        var keywordsMatch = Regex.Match(raw, @"MOTS-CLÉS:\s*(.+)", RegexOptions.Singleline);
        if (keywordsMatch.Success) keywords = keywordsMatch.Groups[1].Value.Trim();

        if (string.IsNullOrWhiteSpace(summary)) return null;
        return new SummarizeResultDto { Summary = summary, Keywords = keywords };
    }

    // ── Analyse de script (6 critères + sentiment) ───────────────────────────
    public async Task<ScriptAnalysisResultDto?> AnalyzeScriptAsync(string transcript, string qualification, bool refusalDetected)
    {
        var apiKey = ApiKey;
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrWhiteSpace(transcript)) return null;

        var prompt =
            "Analyse cette transcription d'appel commercial en français. " +
            $"La qualification du projet est : {qualification}.\n\n" +
            $"Transcription:\n{transcript}\n\n" +
            "Évalue chaque critère de 0 à 10 : écoute active, persuasion, empathie, argumentation, " +
            "gestion des objections/refus, closing (conclusion de vente). " +
            "Donne un score de sentiment (0=très négatif, 1=très positif) et un label (POSITIVE/NEGATIVE/NEUTRAL). " +
            "Indique si le script a été respecté (salutation, présentation), si les objections ont été gérées, " +
            "l'intention du client, et les prochaines étapes recommandées.\n\n" +
            "Réponds UNIQUEMENT en JSON valide (sans texte autour, sans markdown) avec cette structure exacte :\n" +
            "{\"score_ecoute\":0,\"score_persuasion\":0,\"score_empathie\":0,\"score_argumentation\":0," +
            "\"score_refus\":0,\"score_vente\":0,\"sentiment_score\":0.0,\"sentiment\":\"NEUTRAL\"," +
            "\"script_respected\":true,\"objections_handled\":true,\"customer_intent\":\"\",\"next_steps\":\"\"}";

        var raw = await CompleteAsync(apiKey, prompt, maxTokens: 700);
        if (raw == null) return null;

        try
        {
            var jsonMatch = Regex.Match(raw, @"\{.*\}", RegexOptions.Singleline);
            var json = jsonMatch.Success ? jsonMatch.Value : raw;
            var parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (parsed == null) return null;

            var result = new ScriptAnalysisResultDto();
            if (parsed.TryGetValue("score_ecoute", out var v)) result.ScoreEcoute = v.GetInt32();
            if (parsed.TryGetValue("score_persuasion", out v)) result.ScorePersuasion = v.GetInt32();
            if (parsed.TryGetValue("score_empathie", out v)) result.ScoreEmpathie = v.GetInt32();
            if (parsed.TryGetValue("score_argumentation", out v)) result.ScoreArgumentation = v.GetInt32();
            if (parsed.TryGetValue("score_refus", out v)) result.ScoreRefus = v.GetInt32();
            if (parsed.TryGetValue("score_vente", out v)) result.ScoreVente = v.GetInt32();
            if (parsed.TryGetValue("sentiment_score", out v)) result.SentimentScore = v.GetDouble();
            if (parsed.TryGetValue("sentiment", out v)) result.Sentiment = NormalizeSentiment(v.GetString());
            if (parsed.TryGetValue("script_respected", out v)) result.ScriptRespected = v.GetBoolean();
            if (parsed.TryGetValue("objections_handled", out v)) result.ObjectionsHandled = v.GetBoolean();
            if (parsed.TryGetValue("customer_intent", out v)) result.CustomerIntent = v.GetString();
            if (parsed.TryGetValue("next_steps", out v)) result.NextSteps = v.GetString();

            var avg = (result.ScoreEcoute + result.ScorePersuasion + result.ScoreEmpathie +
                       result.ScoreArgumentation + result.ScoreRefus + result.ScoreVente) / 6.0;
            result.ScorePercentage = Math.Round(avg * 10, 1);
            result.Performance = result.ScorePercentage switch
            {
                >= 70 => "Excellent",
                >= 55 => "Bon",
                >= 40 => "Moyen",
                _ => "À améliorer"
            };
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Échec du parsing JSON de l'analyse de script Groq");
            return null;
        }
    }

    private static string NormalizeSentiment(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "NEUTRAL";
        return value.Trim().ToUpperInvariant() switch
        {
            "POSITIF" or "POSITIVE" or "POSITIV" => "POSITIVE",
            "NEGATIF" or "NEGATIVE" or "NEGATIV" => "NEGATIVE",
            _ => "NEUTRAL"
        };
    }

    private async Task<string?> CompleteAsync(string apiKey, string prompt, int maxTokens)
    {
        try
        {
            var body = new
            {
                model = ChatModel,
                messages = new[]
                {
                    new { role = "system", content = "Tu es un assistant d'analyse d'appels commerciaux pour un centre d'appels français. Réponds toujours de manière concise et respecte strictement le format demandé." },
                    new { role = "user", content = prompt }
                },
                max_tokens = maxTokens,
                temperature = 0.3,
                reasoning_effort = "low"
            };

            using var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);

            var responseBytes = await response.Content.ReadAsByteArrayAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Groq chat completion a échoué : {Status} {Body}", response.StatusCode, Encoding.UTF8.GetString(responseBytes));
                return null;
            }

            using var doc = JsonDocument.Parse(responseBytes);
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors de l'appel à Groq");
            return null;
        }
    }

    // ── Transcription audio (Whisper hébergé) ────────────────────────────────
    public async Task<TranscriptionResultDto> TranscribeAsync(Stream audioStream, string fileName, string contentType)
    {
        var apiKey = ApiKey;
        if (string.IsNullOrEmpty(apiKey))
            return new TranscriptionResultDto { Success = false, Error = "Clé API Groq non configurée" };

        try
        {
            using var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(120);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var form = new MultipartFormDataContent();
            using var streamContent = new StreamContent(audioStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrEmpty(contentType) ? "application/octet-stream" : contentType);
            form.Add(streamContent, "file", fileName);
            form.Add(new StringContent(TranscriptionModel), "model");
            form.Add(new StringContent("fr"), "language");
            form.Add(new StringContent("json"), "response_format");

            var response = await client.PostAsync("https://api.groq.com/openai/v1/audio/transcriptions", form);
            var responseBytes = await response.Content.ReadAsByteArrayAsync();

            if (!response.IsSuccessStatusCode)
            {
                var raw = Encoding.UTF8.GetString(responseBytes);
                _logger.LogWarning("Groq transcription a échoué : {Status} {Body}", response.StatusCode, raw);
                return new TranscriptionResultDto { Success = false, Error = $"Groq {response.StatusCode}: {raw}" };
            }

            using var doc = JsonDocument.Parse(responseBytes);
            var text = doc.RootElement.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "";
            return new TranscriptionResultDto { Success = true, Text = text, Language = "fr" };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors de la transcription Groq");
            return new TranscriptionResultDto { Success = false, Error = ex.Message };
        }
    }
}
