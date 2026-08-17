using CrmApi.DTOs.Attendance;

namespace CrmApi.Services.Attendance;

public interface IAttendanceService
{
    Task<ClockResultDto> ClockInAsync(int userId);
    Task<ClockResultDto> ClockOutAsync(int userId);
    Task<ClockResultDto> StartBreakAsync(int userId, string breakType);
    Task<ClockResultDto> EndBreakAsync(int userId);
    Task<AttendanceStatusDto> GetStatusAsync(int userId);
    Task<List<AttendanceReportDto>> GetReportAsync();
    Task<bool> UpdateAttendanceAsync(int userId, UpdateAttendanceDto dto);
    Task<TeamReportDto> GetTeamReportAsync();
    Task<TeamStatusDto> GetTeamStatusAsync();
    Task<AttendanceCheckDto> CheckAttendanceAsync(int agentId, string scheduledStart, string scheduledEnd, DateTime? targetDate);
    Task<List<TeamAttendanceDto>> GetTeamAttendanceAsync(DateTime targetDate);
    Task<List<TeamAttendanceDetailDto>> GetTeamAttendanceDetailAsync();
}
