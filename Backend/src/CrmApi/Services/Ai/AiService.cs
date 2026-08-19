using CrmApi.Data;
using CrmApi.DTOs.Ai;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using CrmApi.Services.Chat;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CrmApi.Services.Ai;

public class AiService : IAiService
{
    private readonly ApplicationDbContext _context;
    private readonly IChatService _chatService;
    private readonly WeightsConfig _weights;

    public AiService(ApplicationDbContext context, IChatService chatService, IOptions<WeightsConfig> weightsOptions)
    {
        _context = context;
        _chatService = chatService;
        _weights = weightsOptions.Value;
    }

    public Task<EligibilityResultDto> ScoreEligibilityAsync(EligibilityRequestDto dto)
    {
        return Task.FromResult(EligibilityCalculator.Calculate(dto.Revenus, dto.Chauffage, dto.Toiture, dto.Isolation, dto.Consommation, dto.CreditScore, dto.SituationBancaire, dto.ProjectType));
    }

    public async Task<EligibilityResultDto> AnalyzeEligibilityAsync(int userId, EligibilityRequestDto dto)
    {
        var result = EligibilityCalculator.Calculate(dto.Revenus, dto.Chauffage, dto.Toiture, dto.Isolation, dto.Consommation, dto.CreditScore, dto.SituationBancaire, dto.ProjectType);
        _context.AiEligibilityLogs.Add(new AiEligibilityLog { AgentId = userId, ClientData = JsonSerializer.Serialize(dto), Result = JsonSerializer.Serialize(result) });
        await _context.SaveChangesAsync();
        return result;
    }

    public Task<FakeRdvResultDto> DetectFakeRdvAsync(FakeRdvRequestDto dto)
    {
        int risk = 0; var flags = new List<string>();
        if (dto.QualityScore.HasValue && dto.QualityScore.Value < 30) { risk += 30; flags.Add("Low quality score"); }
        if (dto.Revenus.HasValue && dto.Revenus.Value > 80000) { risk += 20; flags.Add("Very high income - check veracity"); }
        if (!string.IsNullOrEmpty(dto.ClientPhone) && dto.ClientPhone.Length < 6) { risk += 25; flags.Add("Suspicious phone number"); }
        if (!string.IsNullOrEmpty(dto.AppointmentTime) && (dto.AppointmentTime.Contains("23:") || dto.AppointmentTime.Contains("00:"))) { risk += 15; flags.Add("Unusual appointment time"); }
        var verdict = risk switch { >= 60 => "HIGH_RISK", >= 30 => "SUSPICIOUS", _ => "CLEAN" };
        return Task.FromResult(new FakeRdvResultDto { RiskScore = risk, Verdict = verdict, Flags = flags, AppointmentId = dto.Id, AgentId = dto.AgentId });
    }

    public async Task<AiInsightsDto> GetInsightsAsync(int agentId)
    {
        var appointments = await _context.CrmAppointments.AsNoTracking().Where(a => a.AgentId == agentId).ToListAsync();
        var calls = await _context.Calls.AsNoTracking().Where(c => c.AgentId == agentId.ToString()).ToListAsync();
        return new AiInsightsDto
        {
            AgentId = agentId,
            Appointments = new AppointmentStatsDto { Total = appointments.Count, AvgScore = appointments.Count > 0 ? appointments.Average(a => a.QualityScore) : 0 },
            FinancingDistribution = appointments.GroupBy(a => a.FinancingStatus).Select(g => new DistributionDto { Label = g.Key, Count = g.Count() }).ToList(),
            ProjectDistribution = appointments.GroupBy(a => a.ProjectType).Select(g => new DistributionDto { Label = g.Key, Count = g.Count() }).ToList(),
            CallStats = new CallStatsDto { TotalCalls = calls.Count, AvgCallScore = calls.Count > 0 ? calls.Average(c => c.ScorePercentage) : 0 },
            Tip = calls.Count > 0 && calls.Average(c => c.ScorePercentage) < 50 ? "Focus on improving call quality scores" : "Good performance, keep it up!"
        };
    }

    public Task<QualificationResultDto> CheckQualificationAsync(QualificationCheckDto dto)
    {
        var qualMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["PV"] = new[] { "panneau", "solaire", "photovoltaique", "toiture", "installation", "électricité", "onduleur", "production", "kwh", "ensoleillement" },
            ["PAC"] = new[] { "pompe", "chaleur", "climatisation", "chauffage", "radiateur", "thermostat", "aérothermie", "géothermie", "COP", "réversible" },
            ["ISOLATION"] = new[] { "isolation", "isolant", "combles", "murs", "laine", "polystyrène", "thermique", "acoustique", "ITE", "ITI" },
            ["CCE"] = new[] { "chauffage", "eau", "cumulus", "ballon", "chauffe-eau", "thermique", "éléc", "résistance" }
        };
        var keywords = qualMap.TryGetValue(dto.Qualification, out var kws) ? kws : Array.Empty<string>();
        var transcriptLower = dto.Transcript.ToLowerInvariant();
        var found = keywords.Count(kw => transcriptLower.Contains(kw));
        var ratio = keywords.Length > 0 ? (double)found / keywords.Length : 0;
        var coherent = keywords.Length == 0 || ratio >= 0.4;

        var refusalPatterns = new[] { "pas intéressé", "trop cher", "je réfléchis", "pas maintenant", "je ne veux pas", "merci", "non merci", "rappelez plus tard" };
        var refusalFound = refusalPatterns.Count(r => transcriptLower.Contains(r));
        var refusalDetected = refusalFound >= 2;

        var details = coherent
            ? $"Qualification cohérente ({found}/{keywords.Length} mots-clés, ratio {ratio:P0})"
            : $"Attention: seulement {found}/{keywords.Length} mots-clés trouvés (ratio {ratio:P0})";
        if (refusalDetected)
            details += ". Présence de motifs de refus détectés";

        return Task.FromResult(new QualificationResultDto
        {
            Coherent = coherent && !refusalDetected,
            Details = details,
            RefusalDetected = refusalDetected
        });
    }

    public Task<RefusalResultDto> DetectRefusalAsync(RefusalCheckDto dto)
    {
        var refusalKeywords = new[] { "pas intéressé", "trop cher", "je réfléchis", "pas maintenant", "je ne veux pas", "non merci", "rappelez plus tard", "ça ne m'intéresse pas", "laissez tomber", "pas le temps", "déjà équipé", "pas besoin", "je verrai", "peut-être plus tard" };
        var transcriptLower = dto.Transcript.ToLowerInvariant();
        var found = refusalKeywords.Where(k => transcriptLower.Contains(k)).ToList();

        var pricePatterns = new[] { "trop cher", "budget", "coûte", "prix", "pas les moyens", "économies" };
        var timePatterns = new[] { "pas le temps", "occupé", "travail", "pas maintenant", "rappel" };
        var needPatterns = new[] { "déjà équipé", "pas besoin", "satisfait", "déjà", "pas intéressé" };
        var deferPatterns = new[] { "réfléchis", "je verrai", "peut-être", "plus tard", "autre fois" };

        var categories = new List<string>();
        if (pricePatterns.Any(p => transcriptLower.Contains(p))) categories.Add("budget");
        if (timePatterns.Any(p => transcriptLower.Contains(p))) categories.Add("timing");
        if (needPatterns.Any(p => transcriptLower.Contains(p))) categories.Add("besoin");
        if (deferPatterns.Any(p => transcriptLower.Contains(p))) categories.Add("report");

        return Task.FromResult(new RefusalResultDto
        {
            RefusalDetected = found.Count > 0,
            Confidence = found.Count > 0 ? Math.Min(found.Count * 20, 95) : 0,
            RefusalKeywords = found,
            Categories = categories,
            PrimaryMotive = categories.FirstOrDefault() ?? "none",
            SuggestedResponse = (categories.FirstOrDefault()) switch
            {
                "budget" => "Mettre en avant les aides financières et le retour sur investissement",
                "timing" => "Proposer un rendez-vous à un moment plus adapté",
                "besoin" => "Identifier les besoins non couverts actuels",
                "report" => "Proposer un suivi à une date précise plutôt qu'un rappel vague",
                _ => "Poser une question ouverte pour identifier le vrai motif"
            }
        });
    }

    public Task<AppointmentDetectResultDto> DetectAppointmentAsync(AppointmentDetectDto dto)
    {
        var patterns = new[] { @"rdv", @"rendez[- ]vous", @"le \d{1,2}", @"demain", @"lundi|mardi|mercredi|jeudi|vendredi", @"à \d{1,2}[h:]" };
        var detected = patterns.Any(p => System.Text.RegularExpressions.Regex.IsMatch(dto.Transcript, p, System.Text.RegularExpressions.RegexOptions.IgnoreCase));
        return Task.FromResult(new AppointmentDetectResultDto { Detected = detected, Confidence = detected ? 70 : 0, RequiresValidation = true });
    }

    public Task<AnonymizeResultDto> AnonymizeTranscriptAsync(AnonymizeDto dto)
    {
        var text = dto.Transcript;
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\b\d{16}\b", "****-****-****-****");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b", "** ** ** ** **");
        return Task.FromResult(new AnonymizeResultDto { Anonymized = text });
    }

    public Task<InactivityResultDto> AnalyzeInactivityAsync(InactivityRequestDto dto)
    {
        var detected = false;
        var duration = 0f;
        string? reason = null;

        if (dto.CallDuration.HasValue && dto.CallDuration.Value > 0)
        {
            if (dto.CallDuration.Value < 30)
            {
                detected = true;
                duration = 30 - dto.CallDuration.Value;
                reason = "Appel anormalement court (moins de 30s)";
            }
            else if (!string.IsNullOrEmpty(dto.Transcription))
            {
                var wordCount = dto.Transcription.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
                var expectedWords = dto.CallDuration.Value * 2;
                if (wordCount < expectedWords * 0.3)
                {
                    detected = true;
                    duration = (float)Math.Round(dto.CallDuration.Value * (1f - (float)wordCount / expectedWords), 1);
                    reason = "Faible volume de parole par rapport à la durée d'appel";
                }
            }
        }

        return Task.FromResult(new InactivityResultDto
        {
            InactivityDetected = detected,
            InactivityDuration = duration,
            Reason = reason
        });
    }

    public Task<DiarizationResultDto> DiarizeTranscriptAsync(DiarizationRequestDto dto, int? callDuration = null)
    {
        var text = dto.Transcript;
        if (string.IsNullOrWhiteSpace(text))
            return Task.FromResult(new DiarizationResultDto { Method = "none" });

        var agentSegments = new List<string>();
        var clientSegments = new List<string>();
        var labeledLines = new List<string>();

        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmed = line.Trim();

            if (Regex.IsMatch(trimmed, @"^(Agent|Conseiller|Commercial|Moi)\s*[:\-–—]",
                RegexOptions.IgnoreCase))
            {
                agentSegments.Add(Regex.Replace(trimmed, @"^(Agent|Conseiller|Commercial|Moi)\s*[:\-–—]\s*", "", RegexOptions.IgnoreCase));
                labeledLines.Add($"[Agent] {agentSegments.Last()}");
            }
            else if (Regex.IsMatch(trimmed, @"^(Client|Prospect|Lui|Elle)\s*[:\-–—]",
                RegexOptions.IgnoreCase))
            {
                clientSegments.Add(Regex.Replace(trimmed, @"^(Client|Prospect|Lui|Elle)\s*[:\-–—]\s*", "", RegexOptions.IgnoreCase));
                labeledLines.Add($"[Client] {clientSegments.Last()}");
            }
            else
            {
                var words = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (words.Length > 0)
                {
                    var isAgent = agentSegments.Count <= clientSegments.Count;
                    if (isAgent)
                    {
                        agentSegments.Add(trimmed);
                        labeledLines.Add($"[Agent] {trimmed}");
                    }
                    else
                    {
                        clientSegments.Add(trimmed);
                        labeledLines.Add($"[Client] {trimmed}");
                    }
                }
            }
        }

        var agentText = string.Join(" ", agentSegments);
        var clientText = string.Join(" ", clientSegments);
        var totalAgentWords = agentText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var totalClientWords = clientText.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var totalWords = totalAgentWords + totalClientWords;

        float agentRatio = 0, clientRatio = 0;
        float agentSecs = 0, clientSecs = 0;

        if (totalWords > 0)
        {
            agentRatio = (float)Math.Round((float)totalAgentWords / totalWords, 3);
            clientRatio = (float)Math.Round((float)totalClientWords / totalWords, 3);
        }

        if (callDuration.HasValue && callDuration.Value > 0 && totalWords > 0)
        {
            var wordsPerSecond = (float)totalWords / callDuration.Value;
            agentSecs = wordsPerSecond > 0 ? (float)Math.Round(totalAgentWords / wordsPerSecond, 1) : 0;
            clientSecs = wordsPerSecond > 0 ? (float)Math.Round(totalClientWords / wordsPerSecond, 1) : 0;
        }

        return Task.FromResult(new DiarizationResultDto
        {
            LabeledTranscript = string.Join("\n", labeledLines),
            AgentText = agentText,
            ClientText = clientText,
            AgentTalkRatio = agentRatio,
            ClientTalkRatio = clientRatio,
            AgentSeconds = agentSecs,
            ClientSeconds = clientSecs,
            Method = "rule_based"
        });
    }

    public async Task<SummarizeResultDto> SummarizeTranscriptAsync(SummarizeRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Transcript))
            return new SummarizeResultDto { Summary = "", Keywords = "" };

        try
        {
            var agentContext = !string.IsNullOrEmpty(dto.AgentName)
                ? $"L'agent s'appelle {dto.AgentName}. "
                : "";

            var response = await _chatService.SendMessageAsync(
                $"Voici la transcription d'un appel téléphonique commercial. {agentContext}" +
                $"Résume cet appel en 2-3 phrases en français, puis liste 5-8 mots-clés séparés par des virgules.\n\n" +
                $"Transcription:\n{dto.Transcript}\n\n" +
                $"Format de réponse:\nRÉSUMÉ: <résumé>\nMOTS-CLÉS: <mot1, mot2, ...>",
                null, "admin", dto.AgentName
            );

            var summary = response.Response;
            var keywords = "";

            var summaryMatch = Regex.Match(summary, @"RÉSUMÉ:\s*(.+?)(?=\nMOTS-CLÉS:|$)", RegexOptions.Singleline);
            if (summaryMatch.Success)
                summary = summaryMatch.Groups[1].Value.Trim();

            var keywordsMatch = Regex.Match(summary, @"MOTS-CLÉS:\s*(.+)", RegexOptions.Singleline);
            if (keywordsMatch.Success)
            {
                keywords = keywordsMatch.Groups[1].Value.Trim();
                summary = summary.Replace(keywordsMatch.Value, "").Replace("RÉSUMÉ:", "").Trim();
            }

            if (string.IsNullOrWhiteSpace(summary))
                summary = dto.Transcript.Length > 200
                    ? dto.Transcript[..200] + "..."
                    : dto.Transcript;

            return new SummarizeResultDto { Summary = summary, Keywords = keywords };
        }
        catch
        {
            var fallback = dto.Transcript.Length > 200
                ? dto.Transcript[..200] + "..."
                : dto.Transcript;
            return new SummarizeResultDto { Summary = fallback, Keywords = "" };
        }
    }

    public async Task<ScriptAnalysisResultDto> AnalyzeScriptAsync(ScriptAnalysisRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Transcript))
            return new ScriptAnalysisResultDto
            {
                ScriptRespected = false,
                Sentiment = "NEUTRAL",
                Performance = "N/A",
                ScorePercentage = 0
            };

        try
        {
            var response = await _chatService.SendMessageAsync(
                $"Analyse cette transcription d'appel commercial en français. " +
                $"La qualification du projet est: {dto.Qualification}\n\n" +
                $"Transcription:\n{dto.Transcript}\n\n" +
                $"Évalue chaque critère de 0 à 100: accueil, énergie, voix, écoute, client, opérateur, efficacité, conclusion. " +
                $"Donne un score de sentiment (0=très négatif, 1=très positif). " +
                $"Indique si le script a été respecté (oui/non), si les objections ont été gérées (oui/non), " +
                $"l'intention du client, et les prochaines étapes.\n\n" +
                $"Réponds UNIQUEMENT en JSON valide avec cette structure exacte:\n" +
                $"{{\"score_accueil\":0,\"score_energie\":0,\"score_voix\":0,\"score_ecoute\":0," +
                $"\"score_client\":0,\"score_operateur\":0,\"score_efficacite\":0,\"score_conclusion\":0," +
                $"\"sentiment_score\":0.0,\"sentiment\":\"\",\"script_respected\":true," +
                $"\"objections_handled\":true,\"customer_intent\":\"\",\"next_steps\":\"\"}}",
                null, "admin", null
            );

            var json = response.Response;
            var jsonMatch = Regex.Match(json, @"\{.*\}", RegexOptions.Singleline);
            if (jsonMatch.Success)
                json = jsonMatch.Value;

            var parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (parsed != null)
            {
                var result = new ScriptAnalysisResultDto();
                if (parsed.TryGetValue("score_accueil", out var v)) result.ScoreAccueil = v.GetInt32();
                if (parsed.TryGetValue("score_energie", out v)) result.ScoreEnergie = v.GetInt32();
                if (parsed.TryGetValue("score_voix", out v)) result.ScoreVoix = v.GetInt32();
                if (parsed.TryGetValue("score_ecoute", out v)) result.ScoreEcoute = v.GetInt32();
                if (parsed.TryGetValue("score_client", out v)) result.ScoreClient = v.GetInt32();
                if (parsed.TryGetValue("score_operateur", out v)) result.ScoreOperateur = v.GetInt32();
                if (parsed.TryGetValue("score_efficacite", out v)) result.ScoreEfficacite = v.GetInt32();
                if (parsed.TryGetValue("score_conclusion", out v)) result.ScoreConclusion = v.GetInt32();
                if (parsed.TryGetValue("sentiment_score", out v)) result.SentimentScore = v.GetDouble();
                if (parsed.TryGetValue("sentiment", out v)) result.Sentiment = NormalizeSentiment(v.GetString());
                if (parsed.TryGetValue("script_respected", out v)) result.ScriptRespected = v.GetBoolean();
                if (parsed.TryGetValue("objections_handled", out v)) result.ObjectionsHandled = v.GetBoolean();
                if (parsed.TryGetValue("customer_intent", out v)) result.CustomerIntent = v.GetString();
                if (parsed.TryGetValue("next_steps", out v)) result.NextSteps = v.GetString();

                var (weightedScore, performance) = QualityScoreCalculator.Calculate(
                    result.ScoreAccueil, result.ScoreEnergie, result.ScoreVoix, result.ScoreEcoute,
                    result.ScoreClient, result.ScoreOperateur, result.ScoreEfficacite, result.ScoreConclusion,
                    _weights);
                result.ScorePercentage = weightedScore;
                result.Performance = performance;
                return result;
            }
        }
        catch { }

        return new ScriptAnalysisResultDto
        {
            ScoreAccueil = 50, ScoreEnergie = 50, ScoreVoix = 50, ScoreEcoute = 50,
            ScoreClient = 50, ScoreOperateur = 50, ScoreEfficacite = 50, ScoreConclusion = 50,
            SentimentScore = 0.5, Sentiment = "NEUTRAL", ScorePercentage = 50,
            Performance = "Moyen", ScriptRespected = true, ObjectionsHandled = false
        };
    }

    private static string NormalizeSentiment(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "NEUTRAL";
        var v = value.Trim().ToUpperInvariant();
        return v switch
        {
            "POSITIF" or "POSITIVE" or "POSITIV" => "POSITIVE",
            "NEGATIF" or "NEGATIVE" or "NEGATIV" => "NEGATIVE",
            "NEUTRE" or "NEUTRAL" => "NEUTRAL",
            _ => v
        };
    }

    public Task<PostalCodeExtractResultDto> ExtractPostalCodeAsync(PostalCodeExtractRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Transcript))
            return Task.FromResult(new PostalCodeExtractResultDto { Extracted = false });

        var frenchPostalCodePattern = new Regex(@"\b(0[1-9]|[1-9]\d)\d{3}\b");
        var match = frenchPostalCodePattern.Match(dto.Transcript);
        if (match.Success)
        {
            var code = match.Value;
            var region = code[..2] switch
            {
                "75" => "Île-de-France",
                "91" or "92" or "93" or "94" or "95" => "Île-de-France",
                "69" => "Auvergne-Rhône-Alpes",
                "13" or "83" or "84" or "06" or "04" => "Provence-Alpes-Côte d'Azur",
                "33" or "24" or "47" or "40" or "64" => "Nouvelle-Aquitaine",
                "59" or "62" => "Hauts-de-France",
                "31" or "81" or "82" or "46" or "65" or "09" or "11" or "34" or "66" or "30" or "48" or "12" => "Occitanie",
                "44" or "85" or "49" or "53" or "72" => "Pays de la Loire",
                "35" or "22" or "29" or "56" => "Bretagne",
                "67" or "68" or "57" or "54" or "88" => "Grand Est",
                "76" or "27" or "14" or "50" or "61" => "Normandie",
                "37" or "41" or "45" or "28" or "36" or "18" => "Centre-Val de Loire",
                "21" or "25" or "39" or "70" or "71" or "58" or "89" or "52" or "10" or "77" => "Bourgogne-Franche-Comté",
                _ => "Autre"
            };
            return Task.FromResult(new PostalCodeExtractResultDto
            {
                PostalCode = code,
                Region = region,
                Extracted = true
            });
        }

        return Task.FromResult(new PostalCodeExtractResultDto { Extracted = false });
    }
}
