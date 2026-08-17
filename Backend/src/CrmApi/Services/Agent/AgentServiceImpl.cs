using CrmApi.Data;
using CrmApi.DTOs.Agent;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CrmApi.Services.Agent;

public class AgentServiceImpl : IAgentService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AgentServiceImpl(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<List<AgentSimpleDto>> GetAgentsAsync()
    {
        var users = await _uow.Users.FindAsync(u => u.Role == UserRole.Agent);
        return users.Select(u => new AgentSimpleDto { AgentId = u.Id, AgentName = u.Name }).ToList();
    }

    public async Task<AgentPerformanceDetailDto> GetAgentPerformanceAsync(string agentId)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.Id.ToString() == agentId) ?? throw new KeyNotFoundException("Agent not found");
        
        var today = DateTime.UtcNow.Date;
        var currentMonthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var currentMonthEnd = today;

        var previousMonthStart = currentMonthStart.AddMonths(-1);
        var previousMonthEnd = currentMonthStart.AddDays(-1);

        var currentMonthPerformance = await CalculatePeriodPerformanceAsync(user.Id, user.Name, currentMonthStart, currentMonthEnd);
        var previousMonthPerformance = await CalculatePeriodPerformanceAsync(user.Id, user.Name, previousMonthStart, previousMonthEnd);

        return new AgentPerformanceDetailDto
        {
            AgentId = user.Id,
            AgentName = user.Name,
            CurrentMonth = currentMonthPerformance,
            PreviousMonth = previousMonthPerformance
        };
    }

    private async Task<PerformancePeriodDto> CalculatePeriodPerformanceAsync(int userId, string agentName, DateTime start, DateTime end)
    {
        var calls = await _context.Calls.AsNoTracking()
            .Where(c => c.AgentName == agentName && c.CallDate.HasValue && c.CallDate.Value >= start && c.CallDate.Value <= end)
            .ToListAsync();

        var appointments = await _context.CrmAppointments.AsNoTracking()
            .Where(a => a.AgentId == userId && a.AppointmentDate >= start && a.AppointmentDate <= end)
            .ToListAsync();

        int callsCount = calls.Count;
        int appointmentsCount = appointments.Count;
        double conversionRate = callsCount > 0 ? Math.Round((double)appointmentsCount / callsCount * 100, 1) : 0;
        double avgCallDuration = callsCount > 0 ? Math.Round(calls.Average(c => c.CallDuration ?? 0), 1) : 0;
        double qualityScore = callsCount > 0 ? Math.Round(calls.Average(c => c.ScorePercentage), 1) : 0;

        // Attendance
        var attendances = await _context.Attendances.AsNoTracking()
            .Where(a => a.UserId == userId && a.Date >= start && a.Date <= end)
            .Select(a => a.Date.Date)
            .Distinct()
            .ToListAsync();

        int presentDays = attendances.Count;
        int totalWorkingDays = 0;
        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
            {
                totalWorkingDays++;
            }
        }
        double attendanceRate = totalWorkingDays > 0 ? Math.Round(Math.Min(100.0, (double)presentDays / totalWorkingDays * 100.0), 1) : 100.0;

        // Daily performance (number of appointments per day of the month)
        var dailyPerformance = new List<int>();
        int totalDays = DateTime.DaysInMonth(start.Year, start.Month);
        for (int day = 1; day <= totalDays; day++)
        {
            int count = appointments.Count(a => a.AppointmentDate.Day == day && a.AppointmentDate.Month == start.Month && a.AppointmentDate.Year == start.Year);
            dailyPerformance.Add(count);
        }

        return new PerformancePeriodDto
        {
            Calls = callsCount,
            Appointments = appointmentsCount,
            ConversionRate = conversionRate,
            AvgCallDuration = avgCallDuration,
            QualityScore = qualityScore,
            AttendanceRate = attendanceRate,
            DailyPerformance = dailyPerformance
        };
    }

    public async Task<(bool success, string message, int agentId)> SaveAgentDataAsync(int userId, AgentSaveDto dto)
    {
        var existing = await _context.AgentSavedData.FirstOrDefaultAsync(d => d.AgentId == userId);
        var payload = JsonSerializer.Serialize(dto);
        if (existing != null)
        {
            existing.Payload = payload;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.AgentSavedData.Update(existing);
        }
        else
        {
            var entity = new Models.Entities.AgentSavedData { AgentId = userId, DataType = "session", Payload = payload };
            _context.AgentSavedData.Add(entity);
        }
        await _context.SaveChangesAsync();
        return (true, "Data saved", userId);
    }

    public async Task<AgentSaveDto> GetSavedDataAsync(int userId)
    {
        var data = await _context.AgentSavedData.FirstOrDefaultAsync(d => d.AgentId == userId);
        if (data?.Payload == null) return new AgentSaveDto();
        return JsonSerializer.Deserialize<AgentSaveDto>(data.Payload) ?? new AgentSaveDto();
    }
}
