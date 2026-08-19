using CrmApi.Data;
using CrmApi.Models;

namespace CrmApi.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IRepository<Models.Entities.User>? _users;
    private IRepository<Models.Entities.Agent>? _agents;
    private IRepository<Models.Entities.Call>? _calls;
    private IRepository<Models.Entities.Appointment>? _appointments;
    private IRepository<Models.Entities.CrmAppointment>? _crmAppointments;
    private IRepository<Models.Entities.Followup>? _followups;
    private IRepository<Models.Entities.Log>? _logs;
    private IRepository<Models.Entities.Message>? _messages;
    private IRepository<Models.Entities.ManualEvaluation>? _manualEvaluations;
    private IRepository<Models.Entities.Attendance>? _attendances;
    private IRepository<Models.Entities.AttendanceBreak>? _attendanceBreaks;
    private IRepository<Models.Entities.SalaryRule>? _salaryRules;
    private IRepository<Models.Entities.Salary>? _salaries;
    private IRepository<Models.Entities.AgentSavedData>? _agentSavedData;
    private IRepository<Models.Entities.AiEligibilityLog>? _aiEligibilityLogs;
    private IRepository<Models.Entities.AlertRule>? _alertRules;
    private IRepository<Models.Entities.AlertHistory>? _alertHistories;
    private IRepository<Models.Entities.Lead>? _leads;

    public UnitOfWork(ApplicationDbContext context) => _context = context;

    public IRepository<Models.Entities.User> Users => _users ??= new Repository<Models.Entities.User>(_context);
    public IRepository<Models.Entities.Agent> Agents => _agents ??= new Repository<Models.Entities.Agent>(_context);
    public IRepository<Models.Entities.Call> Calls => _calls ??= new Repository<Models.Entities.Call>(_context);
    public IRepository<Models.Entities.Appointment> Appointments => _appointments ??= new Repository<Models.Entities.Appointment>(_context);
    public IRepository<Models.Entities.CrmAppointment> CrmAppointments => _crmAppointments ??= new Repository<Models.Entities.CrmAppointment>(_context);
    public IRepository<Models.Entities.Followup> Followups => _followups ??= new Repository<Models.Entities.Followup>(_context);
    public IRepository<Models.Entities.Log> Logs => _logs ??= new Repository<Models.Entities.Log>(_context);
    public IRepository<Models.Entities.Message> Messages => _messages ??= new Repository<Models.Entities.Message>(_context);
    public IRepository<Models.Entities.ManualEvaluation> ManualEvaluations => _manualEvaluations ??= new Repository<Models.Entities.ManualEvaluation>(_context);
    public IRepository<Models.Entities.Attendance> Attendances => _attendances ??= new Repository<Models.Entities.Attendance>(_context);
    public IRepository<Models.Entities.AttendanceBreak> AttendanceBreaks => _attendanceBreaks ??= new Repository<Models.Entities.AttendanceBreak>(_context);
    public IRepository<Models.Entities.SalaryRule> SalaryRules => _salaryRules ??= new Repository<Models.Entities.SalaryRule>(_context);
    public IRepository<Models.Entities.Salary> Salaries => _salaries ??= new Repository<Models.Entities.Salary>(_context);
    public IRepository<Models.Entities.AgentSavedData> AgentSavedData => _agentSavedData ??= new Repository<Models.Entities.AgentSavedData>(_context);
    public IRepository<Models.Entities.AiEligibilityLog> AiEligibilityLogs => _aiEligibilityLogs ??= new Repository<Models.Entities.AiEligibilityLog>(_context);
    public IRepository<Models.Entities.AlertRule> AlertRules => _alertRules ??= new Repository<Models.Entities.AlertRule>(_context);
    public IRepository<Models.Entities.AlertHistory> AlertHistories => _alertHistories ??= new Repository<Models.Entities.AlertHistory>(_context);
    public IRepository<Models.Entities.Lead> Leads => _leads ??= new Repository<Models.Entities.Lead>(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();
    public void Dispose() => _context.Dispose();
}
