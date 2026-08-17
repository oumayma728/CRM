using AutoMapper;
using CrmApi.DTOs.Quality;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class QualityProfile : Profile
{
    public QualityProfile()
    {
        CreateMap<ManualEvaluation, EvaluationDto>()
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.Agent.Name))
            .ForMember(d => d.EvaluatorName, opt => opt.MapFrom(s => s.Evaluator.Name));

        CreateMap<CreateEvaluationDto, ManualEvaluation>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.EvaluatorId, opt => opt.Ignore())
            .ForMember(d => d.EvaluationDate, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.Agent, opt => opt.Ignore())
            .ForMember(d => d.Evaluator, opt => opt.Ignore())
            .ForMember(d => d.ScoresJson, opt => opt.MapFrom((src, _) => src.Scores != null
                ? System.Text.Json.JsonSerializer.Serialize(src.Scores) : null))
            .ForMember(d => d.GlobalScore, opt => opt.MapFrom(s => s.GlobalScore ?? 0));
    }
}
