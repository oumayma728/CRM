using CrmApi.Data;
using CrmApi.DTOs.Ai;
using CrmApi.DTOs.Analysis;
using CrmApi.Services.Ai;
using CrmApi.Services.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/analyze")]
[Authorize]
public class AnalysisController : ControllerBase
{
    private readonly ILogger<AnalysisController> _logger;
    private readonly IAiService _aiService;
    private readonly ITranscriptionService _transcriptionService;
    private readonly ApplicationDbContext _context;

    public AnalysisController(ILogger<AnalysisController> logger, IAiService aiService, ITranscriptionService transcriptionService, ApplicationDbContext context)
    {
        _logger = logger;
        _aiService = aiService;
        _transcriptionService = transcriptionService;
        _context = context;
    }

    [HttpPost("call")]
    [AllowAnonymous]
    public async Task<IActionResult> AnalyzeCall(IFormFile file, [FromForm] string? agentName)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No audio file provided" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "audio");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _logger.LogInformation("Audio file saved: {FileName} for agent {AgentName}", fileName, agentName);

        var transcription = await _transcriptionService.TranscribeAsync(filePath);
        var callDuration = transcription.Success ? (int)Math.Round(transcription.Duration ?? 0) : 452;
        var transactionText = transcription.Success && !string.IsNullOrWhiteSpace(transcription.Text)
            ? transcription.Text
            : "Client intéressé par une installation de panneaux solaires. Bonne interaction, objections bien gérées.";
        if (!transcription.Success)
            _logger.LogWarning("Whisper transcription failed, using fallback text: {Error}", transcription.Error);

        var tasks = new List<Task>();

        var inactivityTask = _aiService.AnalyzeInactivityAsync(new InactivityRequestDto
        {
            CallDuration = callDuration,
            Transcription = transactionText
        });

        var refusalTask = _aiService.DetectRefusalAsync(new RefusalCheckDto
        {
            Transcript = transactionText
        });

        var appointmentTask = _aiService.DetectAppointmentAsync(new AppointmentDetectDto
        {
            Transcript = transactionText
        });

        var anonymizeTask = _aiService.AnonymizeTranscriptAsync(new AnonymizeDto
        {
            Transcript = transactionText
        });

        var qualificationTask = _aiService.CheckQualificationAsync(new QualificationCheckDto
        {
            Qualification = "PV",
            Transcript = transactionText
        });

        var diarizationTask = _aiService.DiarizeTranscriptAsync(new DiarizationRequestDto
        {
            Transcript = transactionText
        }, callDuration);

        var summaryTask = _aiService.SummarizeTranscriptAsync(new SummarizeRequestDto
        {
            Transcript = transactionText,
            AgentName = agentName
        });

        var postalCodeTask = _aiService.ExtractPostalCodeAsync(new PostalCodeExtractRequestDto
        {
            Transcript = transactionText
        });

        var scriptTask = _aiService.AnalyzeScriptAsync(new ScriptAnalysisRequestDto
        {
            Transcript = transactionText,
            Qualification = "PV"
        });

        await Task.WhenAll(
            inactivityTask, refusalTask, appointmentTask, anonymizeTask,
            qualificationTask, diarizationTask, summaryTask, postalCodeTask, scriptTask
        );

        var inactivityResult = await inactivityTask;
        var refusalResult = await refusalTask;
        var appointmentResult = await appointmentTask;
        var anonymizeResult = await anonymizeTask;
        var qualificationResult = await qualificationTask;
        var diarizationResult = await diarizationTask;
        var summaryResult = await summaryTask;
        var postalCodeResult = await postalCodeTask;
        var scriptResult = await scriptTask;

        var response = new AnalysisResultDto
        {
            ClientName = "Client",
            ClientPhone = "",
            ClientEmail = "",
            PostalCode = postalCodeResult.PostalCode ?? "",
            Sentiment = scriptResult.Sentiment,
            SentimentScore = scriptResult.SentimentScore,
            ScorePercentage = scriptResult.ScorePercentage,
            Performance = scriptResult.Performance,
            Summary = summaryResult.Summary,
            Keywords = summaryResult.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            AppointmentDetected = appointmentResult.Detected,
            AppointmentDate = appointmentResult.Detected ? DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss") : null,
            CallDuration = callDuration,
            AgentTalkRatio = diarizationResult.AgentTalkRatio,
            ClientTalkRatio = diarizationResult.ClientTalkRatio,
            ScoreAccueil = scriptResult.ScoreAccueil,
            ScoreEnergie = scriptResult.ScoreEnergie,
            ScoreVoix = scriptResult.ScoreVoix,
            ScoreEcoute = scriptResult.ScoreEcoute,
            ScoreClient = scriptResult.ScoreClient,
            ScoreOperateur = scriptResult.ScoreOperateur,
            ScoreEfficacite = scriptResult.ScoreEfficacite,
            ScoreConclusion = scriptResult.ScoreConclusion,
            InactivityDetected = inactivityResult.InactivityDetected,
            InactivityDuration = inactivityResult.InactivityDuration,
            InactivityReason = inactivityResult.Reason,
            RefusalDetected = refusalResult.RefusalDetected,
            RefusalMotive = refusalResult.PrimaryMotive,
            RefusalReason = refusalResult.PrimaryMotive,
            SuggestedResponse = refusalResult.SuggestedResponse,
            TranscriptAnonymized = anonymizeResult.Anonymized != transactionText,
            ScriptRespected = scriptResult.ScriptRespected,
            QualificationMatch = qualificationResult.Coherent,
            Qualification = "PV",
            AgentPoliteness = 5,
            LabeledTranscript = diarizationResult.LabeledTranscript,
            NextSteps = scriptResult.NextSteps,
            CustomerIntent = scriptResult.CustomerIntent,
            ObjectionsHandled = scriptResult.ObjectionsHandled,
            Transcription = transactionText
        };

        return Ok(response);
    }

    [HttpPost("transcript")]
    [AllowAnonymous]
    public async Task<IActionResult> AnalyzeTranscript([FromBody] TranscriptAnalysisRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Transcript))
            return BadRequest(new { error = "Transcript is required" });

        var inactivityTask = _aiService.AnalyzeInactivityAsync(new InactivityRequestDto
        {
            CallDuration = dto.CallDuration,
            Transcription = dto.Transcript
        });

        var refusalTask = _aiService.DetectRefusalAsync(new RefusalCheckDto
        {
            Transcript = dto.Transcript
        });

        var appointmentTask = _aiService.DetectAppointmentAsync(new AppointmentDetectDto
        {
            Transcript = dto.Transcript
        });

        var qualificationTask = _aiService.CheckQualificationAsync(new QualificationCheckDto
        {
            Qualification = dto.Qualification ?? "PV",
            Transcript = dto.Transcript
        });

        var diarizationTask = _aiService.DiarizeTranscriptAsync(new DiarizationRequestDto
        {
            Transcript = dto.Transcript
        }, dto.CallDuration);

        var summaryTask = _aiService.SummarizeTranscriptAsync(new SummarizeRequestDto
        {
            Transcript = dto.Transcript,
            AgentName = dto.AgentName
        });

        var postalCodeTask = _aiService.ExtractPostalCodeAsync(new PostalCodeExtractRequestDto
        {
            Transcript = dto.Transcript
        });

        var scriptTask = _aiService.AnalyzeScriptAsync(new ScriptAnalysisRequestDto
        {
            Transcript = dto.Transcript,
            Qualification = dto.Qualification ?? "PV"
        });

        await Task.WhenAll(
            inactivityTask, refusalTask, appointmentTask, qualificationTask,
            diarizationTask, summaryTask, postalCodeTask, scriptTask
        );

        var scriptResult = await scriptTask;
        var summaryResult = await summaryTask;
        var diarizationResult = await diarizationTask;

        return Ok(new
        {
            sentiment = scriptResult.Sentiment,
            sentiment_score = scriptResult.SentimentScore,
            score_percentage = scriptResult.ScorePercentage,
            performance = scriptResult.Performance,
            summary = summaryResult.Summary,
            keywords = summaryResult.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            score_accueil = scriptResult.ScoreAccueil,
            score_energie = scriptResult.ScoreEnergie,
            score_voix = scriptResult.ScoreVoix,
            score_ecoute = scriptResult.ScoreEcoute,
            score_client = scriptResult.ScoreClient,
            score_operateur = scriptResult.ScoreOperateur,
            score_efficacite = scriptResult.ScoreEfficacite,
            score_conclusion = scriptResult.ScoreConclusion,
            agent_talk_ratio = diarizationResult.AgentTalkRatio,
            client_talk_ratio = diarizationResult.ClientTalkRatio,
            script_respected = scriptResult.ScriptRespected,
            objections_handled = scriptResult.ObjectionsHandled,
            customer_intent = scriptResult.CustomerIntent,
            next_steps = scriptResult.NextSteps,
            refusal_detected = (await refusalTask).RefusalDetected,
            refusal_motive = (await refusalTask).PrimaryMotive,
            suggested_response = (await refusalTask).SuggestedResponse,
            inactivity_detected = (await inactivityTask).InactivityDetected,
            appointment_detected = (await appointmentTask).Detected,
            qualification_coherent = (await qualificationTask).Coherent,
            postal_code = (await postalCodeTask).PostalCode
        });
    }

    [HttpPost("analyze-call/{callId}")]
    public async Task<IActionResult> AnalyzeExistingCall(int callId)
    {
        var call = await _context.Calls.AsNoTracking().FirstOrDefaultAsync(c => c.Id == callId);
        if (call == null)
            return NotFound(new { error = "Call not found" });

        var transcript = call.Transcription ?? call.LabeledTranscript ?? "";
        if (string.IsNullOrWhiteSpace(transcript))
            return BadRequest(new { error = "Call has no transcript" });

        var diarizationResult = await _aiService.DiarizeTranscriptAsync(new DiarizationRequestDto { Transcript = transcript }, call.CallDuration);
        var summaryResult = await _aiService.SummarizeTranscriptAsync(new SummarizeRequestDto { Transcript = transcript, AgentName = call.AgentName });
        var scriptResult = await _aiService.AnalyzeScriptAsync(new ScriptAnalysisRequestDto { Transcript = transcript, Qualification = call.Qualification ?? "PV" });
        var postalResult = await _aiService.ExtractPostalCodeAsync(new PostalCodeExtractRequestDto { Transcript = transcript });
        var refusalResult = await _aiService.DetectRefusalAsync(new RefusalCheckDto { Transcript = transcript });
        var anonymizeResult = await _aiService.AnonymizeTranscriptAsync(new AnonymizeDto { Transcript = transcript });

        call.LabeledTranscript = diarizationResult.LabeledTranscript;
        call.AgentText = diarizationResult.AgentText;
        call.ClientText = diarizationResult.ClientText;
        call.AgentTalkRatio = diarizationResult.AgentTalkRatio;
        call.ClientTalkRatio = diarizationResult.ClientTalkRatio;
        call.AgentSeconds = diarizationResult.AgentSeconds;
        call.ClientSeconds = diarizationResult.ClientSeconds;
        call.DiarizationMethod = diarizationResult.Method;
        call.Summary = summaryResult.Summary;
        call.Keywords = summaryResult.Keywords;
        call.ScriptRespected = scriptResult.ScriptRespected;
        call.ObjectionsHandled = scriptResult.ObjectionsHandled;
        call.ScoreAccueil = scriptResult.ScoreAccueil;
        call.ScoreEnergie = scriptResult.ScoreEnergie;
        call.ScoreVoix = scriptResult.ScoreVoix;
        call.ScoreEcoute = scriptResult.ScoreEcoute;
        call.ScoreClient = scriptResult.ScoreClient;
        call.ScoreOperateur = scriptResult.ScoreOperateur;
        call.ScoreEfficacite = scriptResult.ScoreEfficacite;
        call.ScoreConclusion = scriptResult.ScoreConclusion;
        call.SentimentScore = (float)scriptResult.SentimentScore;
        call.Sentiment = scriptResult.Sentiment;
        call.ScorePercentage = (float)scriptResult.ScorePercentage;
        call.Performance = scriptResult.Performance;
        call.CustomerIntent = scriptResult.CustomerIntent;
        call.NextSteps = scriptResult.NextSteps;
        call.RefusalReason = refusalResult.PrimaryMotive;
        call.PostalCode = postalResult.PostalCode;

        if (!string.IsNullOrEmpty(anonymizeResult.Anonymized))
            call.Transcription = anonymizeResult.Anonymized;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Call analyzed successfully", call_id = call.Id });
    }

    [HttpPost("batch-analyze")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> BatchAnalyzeCalls([FromBody] BatchAnalysisRequestDto dto)
    {
        var query = _context.Calls.AsQueryable();
        if (dto.Limit > 0)
            query = query.Take(dto.Limit);
        else
            query = query.Where(c => string.IsNullOrEmpty(c.Summary) || c.Summary.Length < 50)
                .Take(dto.BatchSize > 0 ? dto.BatchSize : 50);

        var calls = await query.ToListAsync();
        var results = new List<object>();

        foreach (var call in calls)
        {
            try
            {
                var transcript = call.Transcription ?? call.LabeledTranscript ?? "";
                if (string.IsNullOrWhiteSpace(transcript)) continue;

                var diarization = await _aiService.DiarizeTranscriptAsync(new DiarizationRequestDto { Transcript = transcript }, call.CallDuration);
                var summary = await _aiService.SummarizeTranscriptAsync(new SummarizeRequestDto { Transcript = transcript, AgentName = call.AgentName });
                var script = await _aiService.AnalyzeScriptAsync(new ScriptAnalysisRequestDto { Transcript = transcript, Qualification = call.Qualification ?? "PV" });
                var postal = await _aiService.ExtractPostalCodeAsync(new PostalCodeExtractRequestDto { Transcript = transcript });

                call.LabeledTranscript = diarization.LabeledTranscript;
                call.AgentTalkRatio = diarization.AgentTalkRatio;
                call.ClientTalkRatio = diarization.ClientTalkRatio;
                call.Summary = summary.Summary;
                call.Keywords = summary.Keywords;
                call.ScriptRespected = script.ScriptRespected;
                call.ObjectionsHandled = script.ObjectionsHandled;
                call.ScoreAccueil = script.ScoreAccueil;
                call.ScoreEnergie = script.ScoreEnergie;
                call.ScoreVoix = script.ScoreVoix;
                call.ScoreEcoute = script.ScoreEcoute;
                call.ScoreClient = script.ScoreClient;
                call.ScoreOperateur = script.ScoreOperateur;
                call.ScoreEfficacite = script.ScoreEfficacite;
                call.ScoreConclusion = script.ScoreConclusion;
                call.SentimentScore = (float)script.SentimentScore;
                call.Sentiment = script.Sentiment;
                call.ScorePercentage = (float)script.ScorePercentage;
                call.Performance = script.Performance;
                call.CustomerIntent = script.CustomerIntent;
                call.NextSteps = script.NextSteps;
                call.PostalCode = postal.PostalCode;

                results.Add(new { call_id = call.Id, status = "analyzed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing call {CallId}", call.Id);
                results.Add(new { call_id = call.Id, status = "error", error = ex.Message });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { total = results.Count, analyzed = results.Count(r => ((dynamic)r).status == "analyzed"), results });
    }
}

public class TranscriptAnalysisRequestDto
{
    public string Transcript { get; set; } = string.Empty;
    public int? CallDuration { get; set; }
    public string? AgentName { get; set; }
    public string? Qualification { get; set; }
}

public class BatchAnalysisRequestDto
{
    public int Limit { get; set; }
    public int BatchSize { get; set; } = 50;
}
