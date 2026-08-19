using CrmApi.Data;
using CrmApi.DTOs.Call;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Ai;
using CrmApi.Services.Attendance;
using Microsoft.EntityFrameworkCore;

using AiAnonymizeDto = CrmApi.DTOs.Ai.AnonymizeDto;

namespace CrmApi.Services.Call;

public class CallService : ICallService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IAiService _aiService;
    private readonly IAttendanceService _attendanceService;

    public CallService(ApplicationDbContext context, IUnitOfWork uow, IAiService aiService, IAttendanceService attendanceService)
    {
        _context = context;
        _uow = uow;
        _aiService = aiService;
        _attendanceService = attendanceService;
    }

    public async Task<CallsResponseDto> GetCallsAsync(int userId, string role, string? agentName, string? sentiment, int limit, int offset)
    {
        var query = _context.Calls.AsNoTracking().AsQueryable();

        if (role == "agent")
        {
            var user = await _uow.Users.GetByIdAsync(userId);
            query = query.Where(c => c.AgentName == user!.Name);
        }
        if (!string.IsNullOrEmpty(agentName))
            query = query.Where(c => c.AgentName == agentName);
        if (!string.IsNullOrEmpty(sentiment))
            query = query.Where(c => c.Sentiment == sentiment);

        var total = await query.CountAsync();
        var calls = await query.OrderByDescending(c => c.CallDate).Skip(offset).Take(limit).ToListAsync();

        return new CallsResponseDto
        {
            Calls = calls.Select(c => MapToListDto(c)).ToList(),
            Total = total,
            Limit = limit,
            Offset = offset,
            Role = role
        };
    }

    public async Task<CallListDto?> GetCallByIdAsync(int callId, int userId, string role)
    {
        var call = await _context.Calls.AsNoTracking().FirstOrDefaultAsync(c => c.Id == callId);
        if (call == null) return null;
        if (role == "agent")
        {
            var user = await _uow.Users.GetByIdAsync(userId);
            if (user != null && call.AgentName != user.Name) return null;
        }
        return MapToListDto(call);
    }

    public async Task<CallStatsDto> GetCallStatsAsync(int userId, string role, string? agentName)
    {
        var query = _context.Calls.AsNoTracking().AsQueryable();
        if (role == "agent")
        {
            var user = await _uow.Users.GetByIdAsync(userId);
            query = query.Where(c => c.AgentName == user!.Name);
        }
        if (!string.IsNullOrEmpty(agentName))
            query = query.Where(c => c.AgentName == agentName);

        var calls = await query.ToListAsync();
        return new CallStatsDto
        {
            TotalCalls = calls.Count,
            AvgScore = calls.Count > 0 ? Math.Round(calls.Average(c => c.ScorePercentage), 2) : 0,
            SentimentDistribution = calls.GroupBy(c => c.Sentiment ?? "NEUTRAL").ToDictionary(g => g.Key, g => g.Count()),
            PerformanceDistribution = calls.GroupBy(c => c.Performance ?? "N/A").ToDictionary(g => g.Key, g => g.Count()),
            Role = role,
            AgentName = agentName
        };
    }

    public async Task<List<AgentSummaryDto>> GetAgentsSummaryAsync()
    {
        return await _context.Calls.AsNoTracking()
            .GroupBy(c => c.AgentName)
            .Select(g => new AgentSummaryDto
            {
                AgentName = g.Key,
                TotalCalls = g.Count(),
                AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 2),
                PositiveCalls = g.Count(c => c.Sentiment == "POSITIVE"),
                NegativeCalls = g.Count(c => c.Sentiment == "NEGATIVE"),
                NeutralCalls = g.Count(c => c.Sentiment == "NEUTRAL")
            })
            .ToListAsync();
    }

    public async Task<(bool success, int callId, string message)> SaveCallAsync(int userId, CallSaveDto dto)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        var anonymizedNotes = dto.Notes;
        if (!string.IsNullOrEmpty(anonymizedNotes))
        {
            var anonymized = await _aiService.AnonymizeTranscriptAsync(new AiAnonymizeDto { Transcript = anonymizedNotes });
            anonymizedNotes = anonymized.Anonymized;
        }
        var call = new Models.Entities.Call
        {
            AgentId = userId.ToString(),
            AgentName = user?.Name ?? "Unknown",
            CallType = dto.Besoin,
            Problem = dto.Budget,
            CustomerIntent = dto.Interet,
            NextSteps = anonymizedNotes ?? dto.Statut,
            CallDate = dto.CallDate ?? DateTime.UtcNow,
            Status = dto.Statut
        };
        await _uow.Calls.AddAsync(call);
        await _uow.SaveChangesAsync();

        // Auto pointage temps réel : premier appel de la journée = pointage d'entrée automatique
        if (user?.Role == UserRole.Agent)
        {
            try { await _attendanceService.ClockInAsync(userId); }
            catch { /* le pointage manuel reste disponible en cas d'échec */ }
        }

        return (true, call.Id, "Call saved with RGPD anonymization");
    }

    private static CallListDto MapToListDto(Models.Entities.Call c) => new()
    {
        Id = c.Id,
        AgentName = c.AgentName,
        AgentId = c.AgentId,
        AudioFile = c.AudioFile,
        Transcription = c.Transcription,
        Sentiment = c.Sentiment,
        SentimentScore = c.SentimentScore,
        ScorePercentage = c.ScorePercentage,
        Performance = c.Performance,
        Summary = c.Summary,
        Keywords = c.KeywordsList,
        CallType = c.CallType,
        Problem = c.Problem,
        PostalCode = c.PostalCode,
        ScriptRespected = c.ScriptRespected,
        CustomerIntent = c.CustomerIntent,
        ObjectionsHandled = c.ObjectionsHandled,
        AgentPoliteness = c.AgentPoliteness,
        NextSteps = c.NextSteps,
        AppointmentDate = c.AppointmentDate,
        AppointmentConfidence = c.AppointmentConfidence,
        ScoreAccueil = c.ScoreAccueil,
        ScoreEnergie = c.ScoreEnergie,
        ScoreVoix = c.ScoreVoix,
        ScoreEcoute = c.ScoreEcoute,
        ScoreClient = c.ScoreClient,
        ScoreOperateur = c.ScoreOperateur,
        ScoreEfficacite = c.ScoreEfficacite,
        ScoreConclusion = c.ScoreConclusion,
        AgentTalkRatio = c.AgentTalkRatio,
        ClientTalkRatio = c.ClientTalkRatio,
        AgentSeconds = c.AgentSeconds,
        ClientSeconds = c.ClientSeconds,
        DiarizationMethod = c.DiarizationMethod,
        InactivityDetected = c.InactivityDetected,
        InactivityDuration = c.InactivityDuration,
        Qualification = c.Qualification,
        CallDate = c.CallDate,
        CreatedAt = c.CreatedAt
    };
}
