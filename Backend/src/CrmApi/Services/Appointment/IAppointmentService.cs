using CrmApi.DTOs.Appointment;

namespace CrmApi.Services.Appointment;

public interface IAppointmentService
{
    Task<List<AppointmentListDto>> GetAppointmentsAsync(string? date, int? agentId);
    Task<AppointmentDetailDto?> GetAppointmentByIdAsync(int id);
    Task<AppointmentResultDto> CreateAppointmentAsync(int userId, CreateAppointmentDto dto);
    Task<(bool success, int qualityScore)> UpdateAppointmentAsync(int id, UpdateAppointmentDto dto);
    Task<bool> DeleteAppointmentAsync(int id);
    Task<bool> UpdateAppointmentStatusAsync(int id, string status);
}
