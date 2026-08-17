using AutoMapper;
using CrmApi.DTOs.Alert;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class AlertProfile : Profile
{
    public AlertProfile()
    {
        CreateMap<AlertRule, AlertRuleDto>();
        CreateMap<AlertRule, CreateAlertRuleDto>()
            .ForMember(d => d.RuleType, opt => opt.MapFrom(s => s.RuleType))
            .ForMember(d => d.ThresholdValue, opt => opt.MapFrom(s => s.ThresholdValue))
            .ForMember(d => d.NotificationEmail, opt => opt.MapFrom(s => s.NotificationEmail));
        CreateMap<AlertHistory, AlertHistoryDto>();
        CreateMap<AlertHistory, AlertItemDto>()
            .ForMember(d => d.AlertType, opt => opt.MapFrom(s => s.AlertType))
            .ForMember(d => d.Severity, opt => opt.MapFrom(s => s.Severity))
            .ForMember(d => d.Message, opt => opt.MapFrom(s => s.Message))
            .ForMember(d => d.ThresholdValue, opt => opt.MapFrom(s => s.ThresholdValue))
            .ForMember(d => d.ActualValue, opt => opt.MapFrom(s => s.ActualValue));
    }
}
