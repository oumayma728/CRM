using AutoMapper;
using CrmApi.DTOs.Appointment;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class AppointmentProfile : Profile
{
    public AppointmentProfile()
    {
        CreateMap<CrmAppointment, AppointmentListDto>()
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.Agent.Name))
            .ForMember(d => d.FinancingLabel, opt => opt.MapFrom(s => s.FinancingStatus))
            .ForMember(d => d.ColorCode, opt => opt.Ignore());

        CreateMap<CrmAppointment, AppointmentDetailDto>()
            .IncludeBase<CrmAppointment, AppointmentListDto>()
            .ForMember(d => d.AgentUsername, opt => opt.MapFrom(s => s.Agent.Username))
            .ForMember(d => d.RecentCalls, opt => opt.Ignore());

        CreateMap<CreateAppointmentDto, CrmAppointment>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.AgentId, opt => opt.Ignore())
            .ForMember(d => d.QualityScore, opt => opt.Ignore())
            .ForMember(d => d.FinancingStatus, opt => opt.MapFrom(s => "en_attente"))
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Agent, opt => opt.Ignore())
            .ForMember(d => d.CreditScore, opt => opt.MapFrom(s => s.CreditScore ?? 0))
            .ForMember(d => d.Revenus, opt => opt.MapFrom(s => s.Revenus ?? 0))
            .ForMember(d => d.Consommation, opt => opt.MapFrom(s => s.Consommation ?? 0));

        CreateMap<UpdateAppointmentDto, CrmAppointment>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
    }
}
