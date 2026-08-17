namespace CrmApi.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<Models.Entities.User> Users { get; }
    IRepository<Models.Entities.Agent> Agents { get; }
    IRepository<Models.Entities.Call> Calls { get; }
    IRepository<Models.Entities.Appointment> Appointments { get; }
    IRepository<Models.Entities.CrmAppointment> CrmAppointments { get; }
    IRepository<Models.Entities.Followup> Followups { get; }
    IRepository<Models.Entities.Log> Logs { get; }
    IRepository<Models.Entities.Message> Messages { get; }
    IRepository<Models.Entities.ManualEvaluation> ManualEvaluations { get; }
    IRepository<Models.Entities.Attendance> Attendances { get; }
    IRepository<Models.Entities.AttendanceBreak> AttendanceBreaks { get; }
    IRepository<Models.Entities.SalaryRule> SalaryRules { get; }
    IRepository<Models.Entities.Salary> Salaries { get; }
    IRepository<Models.Entities.AgentSavedData> AgentSavedData { get; }
    IRepository<Models.Entities.AiEligibilityLog> AiEligibilityLogs { get; }
    IRepository<Models.Entities.AlertRule> AlertRules { get; }
    IRepository<Models.Entities.AlertHistory> AlertHistories { get; }
    IRepository<Models.Entities.Lead> Leads { get; }
    Task<int> SaveChangesAsync();
}
