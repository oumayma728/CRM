using AutoMapper;
using CrmApi.DTOs.Attendance;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class AttendanceProfile : Profile
{
    public AttendanceProfile()
    {
        CreateMap<Attendance, AttendanceReportDto>()
            .ForMember(d => d.UserName, opt => opt.MapFrom(s => s.User.Name));

        CreateMap<AttendanceBreak, BreakDto>();

        CreateMap<Attendance, TeamAttendanceDto>()
            .ForMember(d => d.AgentName, opt => opt.MapFrom(s => s.User.Name));
    }
}
