using AutoMapper;
using CrmApi.DTOs.Auth;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Role.ToString().ToLower()));
        CreateMap<User, AuthResponseDto>()
            .ForMember(d => d.User, opt => opt.MapFrom(s => s))
            .ForMember(d => d.Token, opt => opt.Ignore());
        CreateMap<CreateUserDto, User>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Password, opt => opt.Ignore())
            .ForMember(d => d.ResetToken, opt => opt.Ignore())
            .ForMember(d => d.ResetTokenExpiry, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.Attendances, opt => opt.Ignore())
            .ForMember(d => d.SentMessages, opt => opt.Ignore())
            .ForMember(d => d.ReceivedMessages, opt => opt.Ignore())
            .ForMember(d => d.CrmAppointments, opt => opt.Ignore())
            .ForMember(d => d.Salaries, opt => opt.Ignore())
            .ForMember(d => d.ReceivedEvaluations, opt => opt.Ignore())
            .ForMember(d => d.GivenEvaluations, opt => opt.Ignore())
            .ForMember(d => d.SavedData, opt => opt.Ignore())
            .ForMember(d => d.Role, opt => opt.MapFrom(s => Enum.Parse<UserRole>(s.Role, true)));
    }
}
