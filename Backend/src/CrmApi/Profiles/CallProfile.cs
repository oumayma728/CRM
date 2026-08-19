using AutoMapper;
using CrmApi.DTOs.Call;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class CallProfile : Profile
{
    public CallProfile()
    {
        CreateMap<Call, CallListDto>()
            .ForMember(d => d.Keywords, opt => opt.MapFrom(s => s.KeywordsList))
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.AgentName))
            .ForMember(d => d.AgentId, opt => opt.MapFrom(s => s.AgentId));
    }
}
