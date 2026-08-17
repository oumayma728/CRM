using AutoMapper;
using CrmApi.DTOs.Salary;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class SalaryProfile : Profile
{
    public SalaryProfile()
    {
        CreateMap<Salary, SalaryDto>()
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.Agent.Name))
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Agent.Role.ToString().ToLower()));

        CreateMap<Salary, SalaryCalculationDto>()
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.Agent.Name))
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Agent.Role.ToString().ToLower()))
            .ForMember(d => d.AbsenceCount, opt => opt.Ignore());

        CreateMap<SalaryRule, SalaryRuleDto>();
        CreateMap<SalaryRule, CreateSalaryRuleDto>()
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => (bool?)s.IsActive));
    }
}
