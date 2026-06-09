using Microsoft.EntityFrameworkCore;
using Backend.Entities;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<SourceFile> SourceFiles { get; set; }
        public DbSet<Country> Countries { get; set; }
        public DbSet<LeadType> LeadTypes { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SourceFileContact> SourceFileContacts { get; set; }
        public DbSet<SourceFileInvalidRow> SourceFileInvalidRows { get; set; }
        public DbSet<ImportJob> ImportJobs { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<CampaignFile> CampaignFiles { get; set; }
        public DbSet<CampaignFileContact> CampaignFileContacts { get; set; }
        public DbSet<CallAttempt> CallAttempts { get; set; }
        public DbSet<CampaignAgents> CampaignAgents { get; set; }
        public DbSet<AgentProfile> AgentProfiles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // SOURCE FILE CONTACTS
            // =========================
            modelBuilder.Entity<SourceFileContact>(entity =>
            {
                entity.ToTable("source_file_contacts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.SourceFileId).HasColumnName("source_file_id");
                entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50);
                entity.Property(e => e.IsValid).HasColumnName("is_valid");
                entity.Property(e => e.OriginalPhoneNumber).HasColumnName("original_phone_number").HasMaxLength(100);
                entity.Property(e => e.ErrorMessage).HasColumnName("error_message").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");

                entity.HasIndex(e => e.SourceFileId).HasDatabaseName("idx_source_file_contacts_source_file_id");
                entity.HasIndex(e => e.PhoneNumber).HasDatabaseName("idx_source_file_contacts_phone_number");

                entity.HasOne(e => e.SourceFile)
                    .WithMany()
                    .HasForeignKey(e => e.SourceFileId)
                    .HasConstraintName("fk_source_file_contacts_source_file");
            });

            // =========================
            // IMPORT JOBS
            // =========================
            modelBuilder.Entity<ImportJob>(entity =>
            {
                entity.ToTable("import_jobs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);
                entity.Property(e => e.OriginalFileName).HasMaxLength(255);
                entity.Property(e => e.DisplayName).HasMaxLength(255);
                entity.Property(e => e.FileHash).HasMaxLength(64);
                entity.Property(e => e.Format).HasMaxLength(10);
                entity.Property(e => e.WorkerId).HasMaxLength(100);
                entity.Property(e => e.Attempts).HasDefaultValue(0);
                entity.Property(e => e.MaxAttempts).HasDefaultValue(3);
                entity.Property(e => e.ErrorMessage).HasMaxLength(2000);

                entity.HasIndex(e => new { e.Status, e.CreatedAt })
                    .HasDatabaseName("idx_import_jobs_status_created_at");
                entity.HasIndex(e => e.SourceFileId)
                    .HasDatabaseName("idx_import_jobs_source_file_id");
                entity.HasIndex(e => new { e.Status, e.LastHeartbeatAt })
                    .HasDatabaseName("idx_import_jobs_status_heartbeat");

                entity.HasOne(e => e.SourceFile)
                    .WithMany()
                    .HasForeignKey(e => e.SourceFileId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.Supplier)
                    .WithMany()
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Country)
                    .WithMany()
                    .HasForeignKey(e => e.CountryId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.LeadType)
                    .WithMany()
                    .HasForeignKey(e => e.LeadTypeId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.UploadedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.UploadedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // =========================
            // SOURCE FILE INVALID ROWS
            // =========================
            modelBuilder.Entity<SourceFileInvalidRow>(entity =>
            {
                entity.ToTable("source_file_invalid_rows");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Phone).HasMaxLength(100);
                entity.Property(e => e.Name).HasMaxLength(255);
                entity.Property(e => e.Reason).HasMaxLength(500);

                entity.HasIndex(e => e.ImportJobId)
                    .HasDatabaseName("idx_source_file_invalid_rows_import_job_id");
                entity.HasIndex(e => e.SourceFileId)
                    .HasDatabaseName("idx_source_file_invalid_rows_source_file_id");

                entity.HasOne(e => e.ImportJob)
                    .WithMany()
                    .HasForeignKey(e => e.ImportJobId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.SourceFile)
                    .WithMany()
                    .HasForeignKey(e => e.SourceFileId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // =========================
            // USERS
            // =========================
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.RoleId)
                    .HasColumnName("role_id")
                    .IsRequired();

                entity.HasOne(u => u.Role)
                      .WithMany(r => r.Users)
                      .HasForeignKey(u => u.RoleId)
                      .OnDelete(DeleteBehavior.Restrict); // Prevent deleting role if users exist
                entity.HasQueryFilter(u => !u.IsDeleted);
            });


            //Roles
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");
                entity.HasKey(r => r.Id);

                entity.Property(r => r.Name)
                      .IsRequired()
                      .HasMaxLength(100);
                entity.Property(r => r.IsActive);
            });

            //Permissions
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.ToTable("permissions");
                entity.HasKey(p => p.Id);

                entity.Property(p => p.Name)
                      .IsRequired()
                      .HasMaxLength(100);


                entity.Property(p => p.GroupName)
                      .HasMaxLength(50);
            });
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("role_permissions");

                // Composite Key
                entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

                entity.HasOne(rp => rp.Role)
                      .WithMany(r => r.RolePermissions)
                      .HasForeignKey(rp => rp.RoleId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rp => rp.Permission)
                      .WithMany(p => p.RolePermissions)
                      .HasForeignKey(rp => rp.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.ToTable("user_permissions");
                entity.HasKey(up => up.Id);

                entity.Property(up => up.ScopeType)
                      .HasMaxLength(50);

                entity.HasIndex(up => up.UserId)
                      .HasDatabaseName("idx_user_permissions_user_id");
                entity.HasIndex(up => new { up.UserId, up.PermissionId, up.ScopeType, up.ScopeUserId })
                      .HasDatabaseName("idx_user_permissions_assignment");

                entity.HasOne(up => up.User)
                      .WithMany(u => u.UserPermissions)
                      .HasForeignKey(up => up.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(up => up.Permission)
                      .WithMany(p => p.UserPermissions)
                      .HasForeignKey(up => up.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(up => up.ScopeUser)
                      .WithMany()
                      .HasForeignKey(up => up.ScopeUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
            // =========================
            // SUPPLIERS
            // =========================
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("suppliers");
                entity.HasKey(e => e.Id);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // =========================
            // SOURCE FILES
            // =========================
            modelBuilder.Entity<SourceFile>(entity =>
            {
                entity.ToTable("source_files");
                entity.HasKey(e => e.Id);
            });

            // =========================
            // COUNTRIES
            // =========================
            modelBuilder.Entity<Country>(entity =>
            {
                entity.ToTable("countries");
                entity.HasKey(e => e.Id);
                entity.HasIndex(c => c.Name).IsUnique();
                entity.Property(c => c.Name)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(c => c.Code)
                    .HasMaxLength(5);
                entity.Property(c => c.PhonePrefix)
                    .HasMaxLength(5);
            });

            // =========================
            // LEAD TYPES
            // =========================
            modelBuilder.Entity<LeadType>(entity =>
            {
                entity.ToTable("lead_types");
                entity.HasKey(e => e.Id);
                entity.HasIndex(lt => new { lt.Code, lt.CountryId }).IsUnique();
                entity.Property(lt => lt.Code)
                    .IsRequired()
                    .HasMaxLength(10);
                entity.Property(lt => lt.Name)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.HasOne(lt => lt.Country)
                    .WithMany(c => c.LeadTypes)
                    .HasForeignKey(lt => lt.CountryId);
            });
            // =========================
            // Campaigns
            // =========================
            modelBuilder.Entity<Campaign>(entity =>
            {
                entity.ToTable("campaigns");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                      .IsRequired()
                      .HasMaxLength(255);
                entity.Property(e => e.Status)
                        .HasConversion<string>()
                        .HasMaxLength(20)
                      .IsRequired();
                entity.Property(e => e.StartDate);
                entity.Property(e => e.CreatedAt)
                      .HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.CreatedByUserId)
                      .IsRequired();
                entity.Property(e => e.AutoPoolSizing)
                      .HasDefaultValue(true);
                entity.Property(e => e.ActivePoolTarget)
                      .HasDefaultValue(75000);
                entity.Property(e => e.LowContactsThreshold)
                      .HasDefaultValue(20000);
                entity.Property(e => e.ContactsPerAgentPerHour)
                      .HasDefaultValue(25);
                entity.Property(e => e.PoolBufferHours)
                      .HasDefaultValue(7);
                entity.Property(e => e.MinPoolTarget)
                      .HasDefaultValue(5000);
                entity.Property(e => e.MaxPoolTarget)
                      .HasDefaultValue(75000);
                entity.Property(e => e.LowPoolRatio)
                      .HasDefaultValue(0.30m);
                entity.HasOne(c => c.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(c => c.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict); // Prevent deleting user if campaigns exist
                entity.HasMany(e => e.CampaignFiles)
                        .WithOne(f => f.Campaign)
                        .HasForeignKey(f => f.CampaignId)
                        .OnDelete(DeleteBehavior.Cascade);//if campaign deleted, delete files
                entity.HasMany(e => e.CampaignAgents)
                        .WithOne(f => f.Campaign)
                        .HasForeignKey(f => f.CampaignId)
                        .OnDelete(DeleteBehavior.Cascade);
                entity.HasQueryFilter(e => !e.IsDeleted); // Soft delete filter never actually deleted

            });
            // =========================
            // Campaigns Files
            // =========================
            modelBuilder.Entity<CampaignFile>(entity =>
            {
                entity.ToTable("campaign_files");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Campaign)
                .WithMany(c => c.CampaignFiles)
                .HasForeignKey(c => c.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.SourceFile)
                .WithMany()
                .HasForeignKey(e => e.SourceFileId)
                .OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.Priority)
                    .HasDefaultValue(0);
            });
            // =========================
            // Campaigns Agents
            // =========================
            modelBuilder.Entity<CampaignAgents>(entity =>
            {
                entity.ToTable("campaign_agents");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.CampaignId, e.UserId })
                .IsUnique();
                entity.HasOne(e => e.Campaign)
                 .WithMany(c => c.CampaignAgents)
                 .HasForeignKey(e => e.CampaignId)
                 .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            });

            // =========================
            // Agent Profiles
            // =========================
            modelBuilder.Entity<AgentProfile>(entity =>
            {
                entity.ToTable("agent_profiles");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.Property(e => e.SalaireBase).HasColumnType("numeric(18,2)");
                entity.Property(e => e.PrimeAssiduite).HasColumnType("numeric(18,2)");
                entity.Property(e => e.NoteEvaluationMoyenne).HasColumnType("numeric(18,2)");
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<AgentProfile>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            // CampaignFileContact - Index pour GetNextContactAsync
            modelBuilder.Entity<CampaignFileContact>(entity =>
            {
                // ✅ Index pour la file d'attente (le plus important !)
                entity.HasIndex(e => new { e.CampaignId, e.CallStatus, e.NextCallAt, e.Id })
                    .HasDatabaseName("idx_campaign_file_contacts_queue");

                // Index pour les contacts assignés à un agent
                entity.HasIndex(e => new { e.AssignedAgentId, e.CallStatus })
                    .HasDatabaseName("idx_campaign_file_contacts_agent_queue");

                entity.Property(e => e.IsAssignable)
                    .HasDefaultValue(false);
                entity.Property(e => e.AssignmentPriority)
                    .HasDefaultValue(0);
                entity.Property(e => e.RandomOrder)
                    .HasDefaultValue(0.0);

                entity.HasIndex(e => new
                    {
                        e.CampaignId,
                        e.IsAssignable,
                        e.CallStatus,
                        e.AssignedAgentId,
                        e.AssignmentPriority,
                        e.RandomOrder,
                        e.Id
                    })
                    .HasDatabaseName("idx_campaign_file_contacts_assignable_queue");

            });

            // =========================
            // Call Attempts
            // =========================
            modelBuilder.Entity<CallAttempt>(entity =>
            {
                entity.ToTable("call_attempts");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasDefaultValue("Assigned");
                entity.Property(e => e.QualificationStatus).HasMaxLength(50);
                entity.Property(e => e.Provider).HasMaxLength(50);
                entity.Property(e => e.ProviderCallId).HasMaxLength(100);
                entity.Property(e => e.RecordingUrl).HasMaxLength(500);
                entity.Property(e => e.StartedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(e => new { e.CampaignFileContactId, e.AttemptNumber })
                    .HasDatabaseName("idx_call_attempts_contact_attempt");
                entity.HasIndex(e => new { e.CampaignId, e.Status, e.StartedAt })
                    .HasDatabaseName("idx_call_attempts_campaign_status_started");
                entity.HasIndex(e => new { e.AgentId, e.StartedAt })
                    .HasDatabaseName("idx_call_attempts_agent_started");
                entity.HasIndex(e => new { e.Provider, e.ProviderCallId })
                    .HasDatabaseName("idx_call_attempts_provider_call_id");

                entity.HasOne(e => e.Campaign)
                    .WithMany()
                    .HasForeignKey(e => e.CampaignId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.CampaignFile)
                    .WithMany()
                    .HasForeignKey(e => e.CampaignFileId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.CampaignFileContact)
                    .WithMany()
                    .HasForeignKey(e => e.CampaignFileContactId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.SourceFileContact)
                    .WithMany()
                    .HasForeignKey(e => e.SourceFileContactId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Agent)
                    .WithMany()
                    .HasForeignKey(e => e.AgentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

        } }
    }
