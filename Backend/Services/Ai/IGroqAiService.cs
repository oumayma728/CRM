using Backend.DTOs.Ai;

namespace Backend.Services.Ai;

public class TranscriptionResultDto
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Language { get; set; }
    public double? Duration { get; set; }
    public string? Error { get; set; }
}

public interface IGroqAiService
{
    /// <summary>Résumé + mots-clés via LLM. Retourne null si l'appel échoue (fallback rule-based côté appelant).</summary>
    Task<SummarizeResultDto?> SummarizeAsync(string transcript, string? agentName);

    /// <summary>Analyse de script (6 critères, sentiment, intention client) via LLM. Retourne null si l'appel échoue.</summary>
    Task<ScriptAnalysisResultDto?> AnalyzeScriptAsync(string transcript, string qualification, bool refusalDetected);

    /// <summary>Transcription audio via l'API Whisper hébergée de Groq.</summary>
    Task<TranscriptionResultDto> TranscribeAsync(Stream audioStream, string fileName, string contentType);
}
