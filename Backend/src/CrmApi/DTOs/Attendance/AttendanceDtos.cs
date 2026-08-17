namespace CrmApi.DTOs.Attendance;

public class AttendanceStatusDto
{
    public string Status { get; set; } = "offline";
    public DateTime? ClockIn { get; set; }
    public string? BreakType { get; set; }
    public DateTime? StartTime { get; set; }
}


public class ClockResultDto
{
    public bool Success { get; set; }
    public int? AttendanceId { get; set; }
    public string? Message { get; set; }
}

public class BreakRequestDto
{
    public string Type { get; set; } = string.Empty;
}

public class AttendanceCheckDto
{
    public string ScheduledStart { get; set; } = string.Empty;
    public string ScheduledEnd { get; set; } = string.Empty;
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public int LateMinutes { get; set; }
    public int EarlyDepartureMinutes { get; set; }
    public bool IsLate { get; set; }
    public bool IsEarlyDeparture { get; set; }
}

public class AttendanceReportDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<BreakDto> Breaks { get; set; } = new();
}

public class BreakDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int DurationMinutes { get; set; }
}

public class UpdateAttendanceDto
{
    public string? Status { get; set; }
    public double? TotalWorkTime { get; set; }
    public double? TotalBreakTime { get; set; }
}

public class TeamAttendanceDto
{
    public string? AgentId { get; set; }
    public string? AgentName { get; set; }
    public DateTime? FirstCall { get; set; }
    public DateTime? LastCall { get; set; }
    public DateTime Date { get; set; }
    public int Actions { get; set; }

public int PauseLimit { get; set; }

public DateTime? LastActivity { get; set; }
}

public class TeamReportDto
{
    public int TotalAgents { get; set; }
    public int PresentToday { get; set; }
    public int AbsentToday { get; set; }
}

public class TeamStatusDto
{
    public int OnlineAgents { get; set; }
    public int OnBreakAgents { get; set; }
    public int OfflineAgents { get; set; }
    public int PresentToday { get; set; }
    public int TotalAgents { get; set; }
    public string Status { get; set; } = "ok";
}

public class TeamAttendanceDetailDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = "agent";
    public string Status { get; set; } = "offline";
    public DateTime? ClockIn { get; set; }
    public double? WorkDurationMinutes { get; set; }
    public string? CurrentBreakType { get; set; }
    public DateTime? CurrentBreakStart { get; set; }
    public int TotalBreakMinutes { get; set; }
}
