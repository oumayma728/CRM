using CrmApi.Data;
using CrmApi.DTOs.Quality;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CrmApi.Services.Quality;

public class QualityService : IQualityService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public QualityService(ApplicationDbContext context, IUnitOfWork uow) { _context = context; _uow = uow; }

    public async Task<bool> CreateEvaluationAsync(int evaluatorId, CreateEvaluationDto dto)
    {
        var evaluation = new Models.Entities.ManualEvaluation
        {
            AgentId = dto.AgentId, EvaluatorId = evaluatorId, CallRef = dto.CallRef, GlobalScore = dto.GlobalScore ?? 0,
            Decision = dto.Decision, Commentaires = dto.Commentaires, ScoresJson = dto.Scores != null ? JsonSerializer.Serialize(dto.Scores) : null,
            EvaluationDate = dto.CallDate.HasValue ? DateTime.SpecifyKind(dto.CallDate.Value, DateTimeKind.Utc) : DateTime.UtcNow
        };
        _context.ManualEvaluations.Add(evaluation);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<EvaluationDto>> GetAgentEvaluationsAsync(int agentId)
    {
        return await _context.ManualEvaluations.AsNoTracking().Include(e => e.Agent).Include(e => e.Evaluator).Where(e => e.AgentId == agentId)
            .Select(e => new EvaluationDto { Id = e.Id, AgentId = e.AgentId, AgentName = e.Agent != null ? e.Agent.Name : null, EvaluatorId = e.EvaluatorId, EvaluatorName = e.Evaluator != null ? e.Evaluator.Name : null, EvaluationDate = e.EvaluationDate, CallRef = e.CallRef, GlobalScore = e.GlobalScore, Decision = e.Decision, Commentaires = e.Commentaires, ScoresJson = e.ScoresJson })
            .ToListAsync();
    }

    public async Task<List<EvaluationDto>> GetAllEvaluationsAsync()
    {
        return await _context.ManualEvaluations.AsNoTracking().Include(e => e.Agent).Include(e => e.Evaluator)
            .Select(e => new EvaluationDto { Id = e.Id, AgentId = e.AgentId, AgentName = e.Agent != null ? e.Agent.Name : null, EvaluatorId = e.EvaluatorId, EvaluatorName = e.Evaluator != null ? e.Evaluator.Name : null, EvaluationDate = e.EvaluationDate, CallRef = e.CallRef, GlobalScore = e.GlobalScore, Decision = e.Decision, Commentaires = e.Commentaires, ScoresJson = e.ScoresJson })
            .ToListAsync();
    }

    public async Task<QualityStatsDto> GetStatsAsync()
    {
        var evals = await _context.ManualEvaluations.AsNoTracking().ToListAsync();
        return new QualityStatsDto { Total = evals.Count, AvgScore = evals.Count > 0 ? Math.Round(evals.Average(e => e.GlobalScore), 2) : 0, ByDecision = evals.GroupBy(e => e.Decision ?? "N/A").ToDictionary(g => g.Key, g => g.Count()) };
    }

    public async Task<bool> DeleteEvaluationAsync(int evalId)
    {
        var e = await _context.ManualEvaluations.FindAsync(evalId);
        if (e == null) return false;
        _context.ManualEvaluations.Remove(e);
        await _context.SaveChangesAsync();
        return true;
    }
}
