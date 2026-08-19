using CrmApi.Data;
using CrmApi.Models.Entities;
using CrmApi.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace CrmApi.Tests.Database;

public class DatabaseSeedServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Mock<ILogger<DatabaseSeedService>> _mockLogger;

    public DatabaseSeedServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_seed_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockLogger = new Mock<ILogger<DatabaseSeedService>>();
    }

    // DatabaseSeedService.StartAsync calls context.Database.MigrateAsync()
    // which requires a relational database provider (not supported by InMemory).
    // These tests require a real PostgreSQL instance to run.
    // They are preserved here as documentation for manual testing with a real DB.
}
