using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<Call> Calls => Set<Call>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<CrmAppointment> CrmAppointments => Set<CrmAppointment>();
    public DbSet<Followup> Followups => Set<Followup>();
    public DbSet<Log> Logs => Set<Log>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<ManualEvaluation> ManualEvaluations => Set<ManualEvaluation>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<AttendanceBreak> AttendanceBreaks => Set<AttendanceBreak>();
    public DbSet<SalaryRule> SalaryRules => Set<SalaryRule>();
    public DbSet<Salary> Salaries => Set<Salary>();
    public DbSet<AgentSavedData> AgentSavedData => Set<AgentSavedData>();
    public DbSet<AiEligibilityLog> AiEligibilityLogs => Set<AiEligibilityLog>();
    public DbSet<AlertRule> AlertRules => Set<AlertRule>();
    public DbSet<AlertHistory> AlertHistories => Set<AlertHistory>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Qualification> Qualifications => Set<Qualification>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SourceFile> SourceFiles => Set<SourceFile>();
    public DbSet<LeadFolder> LeadFolders => Set<LeadFolder>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CrmApi.Models.Configurations.UserConfiguration).Assembly);

        modelBuilder.HasPostgresExtension("uuid-ossp");

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("timestamp with time zone");
                }
            }
        }
    }

    public override int SaveChanges()
    {
        SetTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                    entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
            }
            if (entry.State == EntityState.Modified)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
            }
        }
    }
}
