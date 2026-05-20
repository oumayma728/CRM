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
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<CampaignFile> CampaignFiles { get; set; }
        public DbSet<CampaignAgents> CampaignAgents { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
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
            // =========================
            // SUPPLIERS
            // =========================
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("suppliers");
                entity.HasKey(e => e.Id);
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

        } }
    }