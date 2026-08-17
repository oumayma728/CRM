using CrmApi.Data;
using CrmApi.DTOs.Appointment;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Appointment;

public class AppointmentService : IAppointmentService
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "pending", "confirmed", "cancelled", "rescheduled", "nrp", "hc", "not_interested"
    };

    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AppointmentService(ApplicationDbContext context, IUnitOfWork uow) { _context = context; _uow = uow; }

    public async Task<List<AppointmentListDto>> GetAppointmentsAsync(string? date, int? agentId)
    {
        var query = _context.CrmAppointments.AsNoTracking().Include(a => a.Agent).AsQueryable();
        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
{
    var utcDate = DateTime.SpecifyKind(d.Date, DateTimeKind.Utc);

    query = query.Where(a => a.AppointmentDate == utcDate);
}
        if (agentId.HasValue) query = query.Where(a => a.AgentId == agentId.Value);

        return await query.OrderByDescending(a => a.AppointmentDate).Select(a => new AppointmentListDto
        {
            Id = a.Id, AgentId = a.AgentId, AgentName = a.Agent != null ? a.Agent.Name : "", ClientName = a.ClientName, ClientPhone = a.ClientPhone, ClientEmail = a.ClientEmail,
            ProjectType = a.ProjectType, AppointmentDate = a.AppointmentDate, AppointmentTime = a.AppointmentTime, QualityScore = a.QualityScore, FinancingStatus = a.FinancingStatus,
            Status = a.Status, Revenus = a.Revenus, Chauffage = a.Chauffage, Toiture = a.Toiture, Isolation = a.Isolation, Consommation = a.Consommation,
            CreditScore = a.CreditScore, SituationBancaire = a.SituationBancaire, Notes = a.Notes, CreatedAt = a.CreatedAt
        }).ToListAsync();
    }

    public async Task<AppointmentDetailDto?> GetAppointmentByIdAsync(int id)
    {
        var a = await _context.CrmAppointments.AsNoTracking().Include(a => a.Agent).FirstOrDefaultAsync(a => a.Id == id);
        if (a == null) return null;
        return new AppointmentDetailDto
        {
            Id = a.Id, AgentId = a.AgentId, AgentName = a.Agent?.Name ?? "", AgentUsername = a.Agent?.Username, ClientName = a.ClientName, ClientPhone = a.ClientPhone,
            ClientEmail = a.ClientEmail, ProjectType = a.ProjectType, AppointmentDate = a.AppointmentDate, AppointmentTime = a.AppointmentTime, QualityScore = a.QualityScore,
            FinancingStatus = a.FinancingStatus, Status = a.Status, Revenus = a.Revenus, Chauffage = a.Chauffage, Toiture = a.Toiture, Isolation = a.Isolation,
            Consommation = a.Consommation, CreditScore = a.CreditScore, SituationBancaire = a.SituationBancaire, Notes = a.Notes, CreatedAt = a.CreatedAt,
            RecentCalls = new List<object>()
        };
    }

    public async Task<AppointmentResultDto> CreateAppointmentAsync(int userId, CreateAppointmentDto dto)
    {
        var result = EligibilityCalculator.Calculate(dto.Revenus, dto.Chauffage, dto.Toiture, dto.Isolation, dto.Consommation, dto.CreditScore, dto.SituationBancaire, dto.ProjectType);
        var appointment = new Models.Entities.CrmAppointment
        {
            AgentId = userId, ClientName = dto.ClientName, ClientPhone = dto.ClientPhone, ClientEmail = dto.ClientEmail, ProjectType = dto.ProjectType ?? "PV",
            AppointmentDate = DateTime.SpecifyKind(
            dto.AppointmentDate,
            DateTimeKind.Utc
            ), AppointmentTime = dto.AppointmentTime, Status = "pending", Revenus = dto.Revenus ?? 0,
            Chauffage = dto.Chauffage ?? "", Toiture = dto.Toiture ?? "", Isolation = dto.Isolation ?? "", Consommation = dto.Consommation ?? 0,
            CreditScore = dto.CreditScore ?? 0, SituationBancaire = dto.SituationBancaire ?? "", Notes = dto.Notes, QualityScore = result.Score, FinancingStatus = result.Label
        };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();
        return new AppointmentResultDto { Success = true, Id = appointment.Id, QualityScore = result.Score, Financing = result.Label };
    }

    public async Task<(bool success, int qualityScore)> UpdateAppointmentAsync(int id, UpdateAppointmentDto dto)
    {
        var a = await _context.CrmAppointments.FindAsync(id) ?? throw new KeyNotFoundException("Appointment not found");
        if (dto.ClientName != null) a.ClientName = dto.ClientName;
        if (dto.ClientPhone != null) a.ClientPhone = dto.ClientPhone;
        if (dto.ClientEmail != null) a.ClientEmail = dto.ClientEmail;
        if (dto.ProjectType != null) a.ProjectType = dto.ProjectType;
        if (dto.AppointmentDate != null)
{
    a.AppointmentDate = DateTime.SpecifyKind(
        dto.AppointmentDate.Value,
        DateTimeKind.Utc
    );
}
        if (dto.AppointmentTime != null) a.AppointmentTime = dto.AppointmentTime;
        if (dto.Status != null)
        {
            if (!AllowedStatuses.Contains(dto.Status))
                throw new ArgumentException($"Invalid status '{dto.Status}'. Allowed values: {string.Join(", ", AllowedStatuses)}");
            a.Status = dto.Status;
        }
        if (dto.Revenus != null) a.Revenus = dto.Revenus.Value;
        if (dto.Chauffage != null) a.Chauffage = dto.Chauffage;
        if (dto.Toiture != null) a.Toiture = dto.Toiture;
        if (dto.Isolation != null) a.Isolation = dto.Isolation;
        if (dto.Consommation != null) a.Consommation = dto.Consommation.Value;
        if (dto.CreditScore != null) a.CreditScore = dto.CreditScore.Value;
        if (dto.SituationBancaire != null) a.SituationBancaire = dto.SituationBancaire;
        if (dto.Notes != null) a.Notes = dto.Notes;

        var result = EligibilityCalculator.Calculate(a.Revenus, a.Chauffage, a.Toiture, a.Isolation, a.Consommation, a.CreditScore, a.SituationBancaire, a.ProjectType);
        a.QualityScore = result.Score;
        a.FinancingStatus = result.Label;
        _context.CrmAppointments.Update(a);
        await _context.SaveChangesAsync();
        return (true, result.Score);
    }

    public async Task<bool> DeleteAppointmentAsync(int id)
    {
        var a = await _context.CrmAppointments.FindAsync(id);
        if (a == null) return false;
        _context.CrmAppointments.Remove(a);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAppointmentStatusAsync(int id, string status)
    {
        if (!AllowedStatuses.Contains(status))
            throw new ArgumentException($"Invalid status '{status}'. Allowed values: {string.Join(", ", AllowedStatuses)}");
        var a = await _context.CrmAppointments.FindAsync(id);
        if (a == null) return false;
        a.Status = status;
        _context.CrmAppointments.Update(a);
        await _context.SaveChangesAsync();
        return true;
    }
}
