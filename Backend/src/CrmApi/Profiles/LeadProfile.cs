using AutoMapper;
using CrmApi.DTOs.Lead;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class LeadProfile : Profile
{
    public LeadProfile()
    {
        CreateMap<Lead, LeadDto>()
            .ForMember(d => d.Name, opt => opt.MapFrom(s => s.ContactName))
            .ForMember(d => d.Agent, opt => opt.MapFrom(s => s.AgentId.HasValue ? s.AgentId.ToString() : null));
    }
}
