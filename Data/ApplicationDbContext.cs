using Microsoft.EntityFrameworkCore;
using Backend.Models;
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // USERS
            // =========================
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");

                entity.HasKey(e => e.Id);

                entity.HasIndex(u => u.Email)
                      .IsUnique();

                entity.Property(u => u.Role)
                      .HasConversion<int>();

                entity.HasQueryFilter(u => !u.IsDeleted);
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

            //countries
            modelBuilder.Entity<Country>(entity =>
            {
                entity.ToTable("countries");
                entity.HasKey(e => e.Id);

                entity.HasIndex(c => c.Name)
                      .IsUnique();

                entity.Property(c => c.Name)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(c => c.Code)
                      .HasMaxLength(5);

                entity.Property(c => c.PhonePrefix)
                .HasMaxLength(5);


            });

            //lead types
            modelBuilder.Entity<LeadType>(entity =>
            {
                entity.ToTable("lead_types");

                entity.HasKey(e => e.Id);

                entity.HasIndex(lt => new { lt.Code, lt.CountryId })
                      .IsUnique();  // Same code can exist in different countries

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
        }
    }
}