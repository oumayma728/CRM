using AutoMapper;
using CrmApi.DTOs.Agent;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class AgentProfile : Profile
{
    public AgentProfile()
    {
        CreateMap<Agent, AgentSimpleDto>()
            .ForMember(d => d.AgentId, opt => opt.MapFrom(s => s.Id))
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.Name));
    }
}
