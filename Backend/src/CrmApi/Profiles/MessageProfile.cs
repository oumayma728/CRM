using AutoMapper;
using CrmApi.DTOs.Message;
using CrmApi.Models.Entities;

namespace CrmApi.Profiles;

public class MessageProfile : Profile
{
    public MessageProfile()
    {
        CreateMap<Message, MessageDto>()
            .ForMember(d => d.SenderName, opt => opt.MapFrom(s => s.Sender.Name))
            .ForMember(d => d.ReceiverName, opt => opt.MapFrom(s => s.Receiver.Name));
    }
}
