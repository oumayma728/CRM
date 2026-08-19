using CrmApi.Data;
using CrmApi.DTOs.Attendance;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Attendance;

public class AttendanceService : IAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AttendanceService(ApplicationDbContext context, IUnitOfWork uow) { _context = context; _uow = uow; }

    public async Task<ClockResultDto> ClockInAsync(int userId)
    {
        var today = DateTime.UtcNow.Date;

        var staleSessions = await _context.Attendances
            .Where(a => a.UserId == userId && a.Date < today && (a.Status == "active" || a.Status == "break"))
            .ToListAsync();

        foreach (var stale in staleSessions)
        {
            var openBreaks = await _context.AttendanceBreaks
                .Where(b => b.AttendanceId == stale.Id && b.EndTime == null)
                .ToListAsync();

            foreach (var b in openBreaks)
            {
                b.EndTime = DateTime.UtcNow;
                b.DurationMinutes = (int)(DateTime.UtcNow - b.StartTime).TotalMinutes;
            }

            stale.Status = "completed";
            stale.ClockOut ??= DateTime.UtcNow;
        }

        var latest = await _context.Attendances
            .Where(a => a.UserId == userId && a.Date == today && (a.Status == "active" || a.Status == "break"))
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        if (latest != null)
        {
            if (latest.Status == "break")
                return new ClockResultDto { Success = false, Message = "Impossible de pointer : une pause est en cours. Terminez d'abord la pause." };
            return new ClockResultDto { Success = false, Message = "Vous êtes déjà pointé(e). Statut actuel : actif." };
        }

        var attendance = new Models.Entities.Attendance
        {
            UserId = userId,
            Date = today,
            ClockIn = DateTime.UtcNow,
            Status = "active"
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();
        return new ClockResultDto { Success = true, AttendanceId = (int)attendance.Id, Message = "Pointage d'entrée enregistré" };
    }

    public async Task<ClockResultDto> StartBreakAsync(int userId, string breakType)
    {
        var attendance = await _context.Attendances
            .Where(a => a.UserId == userId && a.Status == "active")
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        if (attendance == null)
        {
            var anyAttendance = await _context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Id)
                .FirstOrDefaultAsync();

            if (anyAttendance == null)
                return new ClockResultDto { Success = false, Message = "Aucun pointage trouvé pour cet utilisateur. Veuillez d'abord pointer votre entrée." };
            if (anyAttendance.Status == "break")
                return new ClockResultDto { Success = false, Message = "Une pause est déjà en cours. Veuillez d'abord terminer la pause actuelle." };
            if (anyAttendance.Status == "completed")
                return new ClockResultDto { Success = false, Message = "Votre pointage du jour est terminé. Impossible de démarrer une pause." };

            return new ClockResultDto { Success = false, Message = "Votre statut actuel ne permet pas de démarrer une pause. Statut actuel : " + anyAttendance.Status };
        }

        var currentBreak = await _context.AttendanceBreaks
            .Where(b => b.AttendanceId == attendance.Id && b.EndTime == null)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync();

        if (currentBreak != null)
            return new ClockResultDto { Success = false, Message = "Une pause est déjà en cours pour ce pointage. Terminez d'abord la pause actuelle avant d'en démarrer une nouvelle." };

        attendance.Status = "break";

       attendance.Status = "break";

_context.Attendances.Update(attendance);

var brk = new AttendanceBreak
{
    AttendanceId = attendance.Id,
    Type = breakType,
    StartTime = DateTime.UtcNow
};

_context.AttendanceBreaks.Add(brk);

await _context.SaveChangesAsync();

        return new ClockResultDto
        {
            Success = true,
            AttendanceId = (int)attendance.Id,
            Message = "Pause démarrée"
        };
    }

    public async Task<ClockResultDto> ClockOutAsync(int userId)
    {
        var attendance = await _context.Attendances
            .Where(a => a.UserId == userId && (a.Status == "active" || a.Status == "break"))
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        if (attendance == null)
            return new ClockResultDto { Success = false, Message = "Aucun pointage actif trouvé. Veuillez d'abord pointer votre entrée." };

        var openBreak = await _context.AttendanceBreaks
            .Where(b => b.AttendanceId == attendance.Id && b.EndTime == null)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync();

        if (openBreak != null)
        {
            openBreak.EndTime = DateTime.UtcNow;
            openBreak.DurationMinutes = (int)(openBreak.EndTime.Value - openBreak.StartTime).TotalMinutes;
        }

        attendance.ClockOut = DateTime.UtcNow;
        attendance.Status = "completed";
        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync();
        return new ClockResultDto { Success = true, Message = "Pointage de sortie enregistré" };
    }

   

    public async Task<ClockResultDto> EndBreakAsync(int userId)
    {
        Console.WriteLine($"USER = {userId}");

var all = await _context.Attendances
    .Where(a => a.UserId == userId)
    .OrderByDescending(a => a.Id)
    .ToListAsync();

foreach (var a in all)
{
    Console.WriteLine($"ID={a.Id} STATUS={a.Status}");
}
        var attendance = await _context.Attendances
            .Where(a => a.UserId == userId && a.Status == "break")
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        if (attendance == null)
        {
            var anyAttendance = await _context.Attendances
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Id)
                .FirstOrDefaultAsync();

            if (anyAttendance == null)
                return new ClockResultDto { Success = false, Message = "Aucun pointage trouvé pour cet utilisateur." };
            if (anyAttendance.Status == "active")
                return new ClockResultDto { Success = false, Message = "Aucune pause en cours. Vous êtes actuellement actif." };
            if (anyAttendance.Status == "completed")
                return new ClockResultDto { Success = false, Message = "Votre pointage du jour est terminé. Impossible de terminer une pause." };

            return new ClockResultDto { Success = false, Message = "Aucune pause en cours. Statut actuel : " + anyAttendance.Status };
        }

        var openBreak = await _context.AttendanceBreaks
            .Where(b => b.AttendanceId == attendance.Id && b.EndTime == null)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync();

        if (openBreak == null)
        {
            attendance.Status = "active";
            _context.Attendances.Update(attendance);
            await _context.SaveChangesAsync();
            return new ClockResultDto { Success = true, Message = "Aucune pause ouverte trouvée. Statut corrigé en actif." };
        }

        openBreak.EndTime = DateTime.UtcNow;
        openBreak.DurationMinutes = (int)(DateTime.UtcNow - openBreak.StartTime).TotalMinutes;
        attendance.Status = "active";
        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync();
        return new ClockResultDto { Success = true, Message = "Pause terminée" };
    }

    public async Task<AttendanceStatusDto> GetStatusAsync(int userId)
    {
        var today = DateTime.UtcNow.Date;
        var attendance = await _context.Attendances
    .Where(a =>
        a.UserId == userId &&
        a.Date == today &&
        (a.Status == "active" || a.Status == "break"))
    .OrderByDescending(a => a.Id)
    .FirstOrDefaultAsync();
        if (attendance == null) return new AttendanceStatusDto { Status = "offline" };
        if (attendance.Status == "break")
        {
            var brk = await _context.AttendanceBreaks.FirstOrDefaultAsync(b => b.AttendanceId == attendance.Id && b.EndTime == null);
            return new AttendanceStatusDto { Status = "break", ClockIn = attendance.ClockIn, BreakType = brk?.Type, StartTime = brk?.StartTime };
        }
        return new AttendanceStatusDto { Status = "active", ClockIn = attendance.ClockIn };
    }

    public async Task<List<AttendanceReportDto>> GetReportAsync()
    {
        var records = await _context.Attendances.AsNoTracking().Include(a => a.User).Include(a => a.Breaks).OrderByDescending(a => a.Date).ToListAsync();
        return records.Select(r => new AttendanceReportDto { Id = (int)r.Id, UserId = r.UserId, UserName = r.User?.Name ?? "", Date = r.Date, ClockIn = r.ClockIn, ClockOut = r.ClockOut, Status = r.Status, Breaks = r.Breaks.Select(b => new BreakDto { Id = b.Id, Type = b.Type, StartTime = b.StartTime, EndTime = b.EndTime, DurationMinutes = b.DurationMinutes }).ToList() }).ToList();
    }

    public async Task<bool> UpdateAttendanceAsync(int userId, UpdateAttendanceDto dto)
    {
        var attendance = await _context.Attendances
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        if (attendance == null) return false;

        if (dto.Status != null) attendance.Status = dto.Status;
        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync();
        return true;
    }

 public async Task<TeamReportDto> GetTeamReportAsync()
{
    var today = DateTime.UtcNow.Date;

    var totalAgents = await _context.Users.CountAsync(u =>
        u.Role == UserRole.Agent);

    var presentToday = await _context.Attendances
        .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
        .GroupBy(a => a.UserId)
        .CountAsync();

    return new TeamReportDto
    {
        TotalAgents = totalAgents,
        PresentToday = presentToday,
        AbsentToday = totalAgents - presentToday
    };
}

  public async Task<TeamStatusDto> GetTeamStatusAsync()
{
    var today = DateTime.UtcNow.Date;

    var total = await _context.Users.CountAsync(u =>
        u.Role == UserRole.Agent);

    var todayAttendances = await _context.Attendances
        .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
        .GroupBy(a => a.UserId)
        .Select(g => g.OrderByDescending(a => a.Id).First())
        .ToListAsync();

    var online = todayAttendances.Count(a => a.Status == "active");
    var onBreak = todayAttendances.Count(a => a.Status == "break");

    return new TeamStatusDto
    {
        OnlineAgents = online,
        OnBreakAgents = onBreak,
        OfflineAgents = total - online - onBreak,
        PresentToday = online + onBreak,
        TotalAgents = total,
        Status = "ok"
    };
}

    public async Task<AttendanceCheckDto> CheckAttendanceAsync(int agentId, string scheduledStart, string scheduledEnd, DateTime? targetDate)
    {
        var date = targetDate ?? DateTime.UtcNow.Date;
        var calls = await _context.Calls.AsNoTracking().Where(c => c.AgentId == agentId.ToString() && c.CallDate.HasValue && c.CallDate!.Value.Date == date).ToListAsync();
        var firstCall = calls.Any() ? calls.Min(c => c.CallDate) : null;
        var lastCall = calls.Any() ? calls.Max(c => c.CallDate) : null;
        var scheduledStartDt = DateTime.Parse($"{date:yyyy-MM-dd} {scheduledStart}");
        var scheduledEndDt = DateTime.Parse($"{date:yyyy-MM-dd} {scheduledEnd}");
        int lateMinutes = firstCall.HasValue && firstCall.Value > scheduledStartDt.AddMinutes(15) ? (int)(firstCall.Value - scheduledStartDt).TotalMinutes : 0;
        int earlyMinutes = lastCall.HasValue && lastCall.Value < scheduledEndDt.AddMinutes(-15) ? (int)(scheduledEndDt - lastCall.Value).TotalMinutes : 0;
        return new AttendanceCheckDto { ScheduledStart = scheduledStart, ScheduledEnd = scheduledEnd, ActualStart = firstCall, ActualEnd = lastCall, LateMinutes = lateMinutes, EarlyDepartureMinutes = earlyMinutes, IsLate = lateMinutes > 0, IsEarlyDeparture = earlyMinutes > 0 };
    }

    public async Task<List<TeamAttendanceDto>> GetTeamAttendanceAsync(DateTime targetDate)
    {
        var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue && c.CallDate!.Value.Date == targetDate.Date).GroupBy(c => c.AgentName).Select(g => new TeamAttendanceDto { AgentName = g.Key, FirstCall = g.Min(c => c.CallDate), LastCall = g.Max(c => c.CallDate), Date = targetDate.Date }).ToListAsync();
        return calls;
    }

    public async Task<List<TeamAttendanceDetailDto>> GetTeamAttendanceDetailAsync()
    {
        var today = DateTime.UtcNow.Date;
        var agents = await _context.Users
            .Where(u => u.Role == UserRole.Agent || u.Role == UserRole.Admin || u.Role == UserRole.Qualite)
            .AsNoTracking()
            .ToListAsync();

        var todayAttendances = await _context.Attendances
            .Where(a => a.Date == today && (a.Status == "active" || a.Status == "break"))
            .Include(a => a.Breaks)
            .AsNoTracking()
            .ToListAsync();

        var latestByUser = todayAttendances
            .GroupBy(a => a.UserId)
            .Select(g => g.OrderByDescending(a => a.Id).First())
            .ToDictionary(a => a.UserId);

        var result = new List<TeamAttendanceDetailDto>();
        foreach (var agent in agents)
        {
            var dto = new TeamAttendanceDetailDto
            {
                UserId = agent.Id,
                UserName = agent.Name ?? agent.Username,
                UserRole = agent.Role.ToString().ToLowerInvariant(),
                Status = "offline"
            };

            if (latestByUser.TryGetValue(agent.Id, out var att))
            {
                dto.Status = att.Status;
                dto.ClockIn = att.ClockIn;
                if (att.ClockIn != default)
                {
                    var end = att.ClockOut ?? DateTime.UtcNow;
                    var totalMinutes = (end - att.ClockIn).TotalMinutes;
                    var breakMinutes = att.Breaks.Sum(b => b.DurationMinutes > 0 ? b.DurationMinutes :
                        (b.EndTime.HasValue ? (b.EndTime.Value - b.StartTime).TotalMinutes : (DateTime.UtcNow - b.StartTime).TotalMinutes));
                    dto.WorkDurationMinutes = Math.Max(0, totalMinutes - breakMinutes);
                    dto.TotalBreakMinutes = (int)breakMinutes;
                }

                if (att.Status == "break")
                {
                    var openBreak = att.Breaks
                        .Where(b => b.EndTime == null)
                        .OrderByDescending(b => b.Id)
                        .FirstOrDefault();
                    if (openBreak != null)
                    {
                        dto.CurrentBreakType = openBreak.Type;
                        dto.CurrentBreakStart = openBreak.StartTime;
                    }
                }
            }

            result.Add(dto);
        }
        return result;
    }
}
