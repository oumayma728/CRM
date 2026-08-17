using CrmApi.Data;
using CrmApi.Models.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Tests.Database;

public class DatabaseTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public DatabaseTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_db_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateUser_PersistsToDatabase()
    {
        var user = new User
        {
            Username = "newuser",
            Password = "hash",
            Name = "New User",
            Role = UserRole.Agent,
            Email = "new@test.com",
            CreatedAt = DateTime.UtcNow,
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var saved = await _context.Users.FirstOrDefaultAsync(u => u.Username == "newuser");
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("New User");
        saved.Role.Should().Be(UserRole.Agent);
    }

    [Fact]
    public async Task UpdateUser_ModifiesDatabase()
    {
        var user = new User
        {
            Username = "updateuser",
            Password = "hash",
            Name = "Original",
            Role = UserRole.Agent,
            Email = "update@test.com",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        user.Name = "Updated Name";
        await _context.SaveChangesAsync();

        var saved = await _context.Users.FirstAsync(u => u.Id == user.Id);
        saved.Name.Should().Be("Updated Name");
    }

    [Fact]
    public async Task DeleteUser_RemovesFromDatabase()
    {
        var user = new User
        {
            Username = "deleteuser",
            Password = "hash",
            Name = "To Delete",
            Role = UserRole.Agent,
            Email = "delete@test.com",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        var exists = await _context.Users.AnyAsync(u => u.Id == user.Id);
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task CascadeDelete_UserDeletesAttendance()
    {
        var user = new User
        {
            Username = "cascadeuser",
            Password = "hash",
            Name = "Cascade",
            Role = UserRole.Agent,
            Email = "cascade@test.com",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var attendance = new Attendance
        {
            UserId = user.Id,
            Date = DateTime.UtcNow,
            ClockIn = DateTime.UtcNow,
            Status = "active",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        var attExists = await _context.Attendances.AnyAsync(a => a.Id == attendance.Id);
        attExists.Should().BeFalse();
    }

    [Fact]
    public async Task RequiredField_UserName_Null_Throws()
    {
        var user = new User
        {
            Username = null!,
            Password = "hash",
            Name = "No Username",
            Role = UserRole.Agent,
            Email = "test@test.com",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);

        await FluentActions.Invoking(() => _context.SaveChangesAsync())
            .Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task BulkInsert_100Users_PersistsAll()
    {
        var users = Enumerable.Range(1, 100).Select(i => new User
        {
            Username = $"bulkuser{i}",
            Password = "hash",
            Name = $"Bulk User {i}",
            Role = UserRole.Agent,
            Email = $"bulk{i}@test.com",
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        _context.Users.AddRange(users);
        await _context.SaveChangesAsync();

        var count = await _context.Users.CountAsync(u => u.Username.StartsWith("bulkuser"));
        count.Should().Be(100);
    }

    [Fact]
    public async Task Attendance_ClockOutUpdate_ChangesStatus()
    {
        var user = new User
        {
            Username = "attendanceuser",
            Password = "hash",
            Name = "Attendance",
            Role = UserRole.Agent,
            Email = "att@test.com",
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var attendance = new Attendance
        {
            UserId = user.Id,
            Date = DateTime.UtcNow,
            ClockIn = DateTime.UtcNow.AddHours(-8),
            Status = "active",
            CreatedAt = DateTime.UtcNow.AddHours(-8),
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        attendance.ClockOut = DateTime.UtcNow;
        attendance.Status = "completed";
        await _context.SaveChangesAsync();

        var saved = await _context.Attendances.FirstAsync(a => a.Id == attendance.Id);
        saved.ClockOut.Should().NotBeNull();
        saved.Status.Should().Be("completed");
    }
}
