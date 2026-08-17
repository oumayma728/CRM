using CrmApi.Data;
using CrmApi.DTOs.Attendance;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Attendance;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AttendanceServiceTests
{
    private readonly AttendanceService _sut;
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public AttendanceServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_att_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockUow = new Mock<IUnitOfWork>();
        _sut = new AttendanceService(_context, _mockUow.Object);
    }

    [Fact]
    public async Task ClockInAsync_FirstTime_CreatesRecord()
    {
        var result = await _sut.ClockInAsync(userId: 1);

        result.Success.Should().BeTrue();
        result.AttendanceId.Should().HaveValue();
        result.Message.Should().Contain("Pointage d'entrée");
    }

    [Fact]
    public async Task ClockInAsync_AlreadyClockedIn_ReturnsError()
    {
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-2),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.ClockInAsync(userId: 1);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("déjà pointé");
    }

    [Fact]
    public async Task ClockOutAsync_ActiveRecord_ClocksOut()
    {
        var att = new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-8),
            Status = "active"
        };
        _context.Attendances.Add(att);
        await _context.SaveChangesAsync();

        var result = await _sut.ClockOutAsync(userId: 1);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("Pointage de sortie");
    }

    [Fact]
    public async Task ClockOutAsync_NoActiveRecord_ReturnsError()
    {
        var result = await _sut.ClockOutAsync(userId: 1);
        result.Success.Should().BeFalse();
    }

    [Fact]
    public async Task StartBreakAsync_ActiveRecord_StartsBreak()
    {
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-3),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.StartBreakAsync(userId: 1, breakType: "dejeuner");

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("Pause");
    }

    [Fact]
    public async Task EndBreakAsync_ActiveBreak_EndsBreak()
    {
        var att = new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-4),
            Status = "break"
        };
        _context.Attendances.Add(att);
        await _context.SaveChangesAsync();

        _context.AttendanceBreaks.Add(new AttendanceBreak
        {
            AttendanceId = att.Id,
            Type = "dejeuner",
            StartTime = DateTime.UtcNow.AddMinutes(-30),
            EndTime = null
        });
        await _context.SaveChangesAsync();

        var result = await _sut.EndBreakAsync(userId: 1);

        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetStatusAsync_NoRecord_ReturnsOffline()
    {
        var result = await _sut.GetStatusAsync(userId: 1);

        result.Status.Should().Be("offline");
    }

    [Fact]
    public async Task GetStatusAsync_ActiveRecord_ReturnsStatus()
    {
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-2),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.GetStatusAsync(userId: 1);

        result.Status.Should().Be("active");
        result.ClockIn.Should().BeCloseTo(DateTime.UtcNow.AddHours(-2), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UpdateAttendanceAsync_ExistingRecord_Updates()
    {
        var att = new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-8),
            Status = "active"
        };
        _context.Attendances.Add(att);
        await _context.SaveChangesAsync();

        var dto = new UpdateAttendanceDto
        {
            Status = "completed",
            TotalWorkTime = 8.0,
            TotalBreakTime = 1.0
        };

        var result = await _sut.UpdateAttendanceAsync(userId: 1, dto);

        result.Should().BeTrue();
        var updated = await _context.Attendances.FindAsync(att.Id);
        updated!.Status.Should().Be("completed");
    }

    [Fact]
    public async Task CheckAttendence_LateArrival_DetectsLateness()
    {
        var result = await _sut.CheckAttendanceAsync(
            agentId: 1,
            scheduledStart: "09:00",
            scheduledEnd: "17:00",
            targetDate: DateTime.UtcNow.Date
        );

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetTeamStatusAsync_ReturnsAggregatedCounts()
    {
        var today = DateTime.UtcNow.Date;
        _context.Attendances.AddRange(
            new Attendance { UserId = 1, Date = today, ClockIn = DateTime.UtcNow.AddHours(-2), Status = "active" },
            new Attendance { UserId = 2, Date = today, ClockIn = DateTime.UtcNow.AddHours(-3), Status = "on_break" },
            new Attendance { UserId = 3, Date = today, ClockIn = DateTime.UtcNow.AddHours(-4), Status = "completed" }
        );
        _context.Users.AddRange(
            new User { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow },
            new User { Id = 2, Username = "agent2", Name = "Agent 2", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamStatusAsync();

        result.OnlineAgents.Should().BeGreaterThanOrEqualTo(0);
        result.TotalAgents.Should().BeGreaterThanOrEqualTo(0);
        result.Status.Should().Be("ok");
    }

    [Fact]
    public async Task ClockInAsync_StaleActiveSessionYesterday_ClosesAndCreatesNew()
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = yesterday,
            ClockIn = yesterday.AddHours(8),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.ClockInAsync(userId: 1);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("Pointage d'entrée");

        var stale = await _context.Attendances.FirstAsync(a => a.Date == yesterday);
        stale.Status.Should().Be("completed");
        stale.ClockOut.Should().NotBeNull();
    }

    [Fact]
    public async Task ClockInAsync_StaleBreakSession_ClosesAndCreatesNew()
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = yesterday,
            ClockIn = yesterday.AddHours(8),
            Status = "break"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.ClockInAsync(userId: 1);

        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ClockInAsync_AlreadyClockedInToday_ReturnsError()
    {
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = DateTime.UtcNow.Date,
            ClockIn = DateTime.UtcNow.AddHours(-1),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.ClockInAsync(userId: 1);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("déjà pointé");
    }

    [Fact]
    public async Task StartBreakAsync_NoActiveRecord_ReturnsError()
    {
        var result = await _sut.StartBreakAsync(userId: 1, breakType: "cafe");

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Aucun pointage");
    }

    [Fact]
    public async Task GetTeamAttendanceDetailAsync_ActiveUser_ShowsActive()
    {
        var today = DateTime.UtcNow.Date;
        _context.Users.Add(new User
        {
            Id = 1,
            Username = "agent1",
            Name = "Agent 1",
            Role = UserRole.Agent,
            Password = "hash",
            Email = "a@b.com",
            CreatedAt = DateTime.UtcNow
        });
        _context.Attendances.Add(new Attendance
        {
            UserId = 1,
            Date = today,
            ClockIn = DateTime.UtcNow.AddMinutes(-10),
            Status = "active"
        });
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamAttendanceDetailAsync();

        result.Should().ContainSingle();
        result[0].Status.Should().Be("active");
    }

    [Fact]
    public async Task GetTeamAttendanceDetailAsync_OfflineUser_ShowsOffline()
    {
        _context.Users.Add(new User
        {
            Id = 1,
            Username = "agent1",
            Name = "Agent 1",
            Role = UserRole.Agent,
            Password = "hash",
            Email = "a@b.com",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamAttendanceDetailAsync();

        result.Should().ContainSingle();
        result[0].Status.Should().Be("offline");
    }

    [Fact]
    public async Task GetTeamAttendanceDetailAsync_BreakUser_ShowsBreak()
    {
        var today = DateTime.UtcNow.Date;
        _context.Users.Add(new User
        {
            Id = 1,
            Username = "agent1",
            Name = "Agent 1",
            Role = UserRole.Agent,
            Password = "hash",
            Email = "a@b.com",
            CreatedAt = DateTime.UtcNow
        });
        var att = new Attendance
        {
            UserId = 1,
            Date = today,
            ClockIn = DateTime.UtcNow.AddHours(-2),
            Status = "break"
        };
        _context.Attendances.Add(att);
        _context.AttendanceBreaks.Add(new AttendanceBreak
        {
            AttendanceId = att.Id,
            Type = "dejeuner",
            StartTime = DateTime.UtcNow.AddMinutes(-10),
            EndTime = null
        });
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamAttendanceDetailAsync();

        result[0].Status.Should().Be("break");
        result[0].CurrentBreakType.Should().Be("dejeuner");
    }

    [Fact]
    public async Task GetTeamReportAsync_ReturnsCounts()
    {
        var today = DateTime.UtcNow.Date;
        _context.Users.AddRange(
            new User { Id = 1, Username = "a1", Name = "A1", Role = UserRole.Agent, Password = "h", Email = "", CreatedAt = DateTime.UtcNow },
            new User { Id = 2, Username = "a2", Name = "A2", Role = UserRole.Agent, Password = "h", Email = "", CreatedAt = DateTime.UtcNow }
        );
        _context.Attendances.Add(new Attendance { UserId = 1, Date = today, ClockIn = today.AddHours(8), Status = "active" });
        await _context.SaveChangesAsync();

        var result = await _sut.GetTeamReportAsync();

        result.TotalAgents.Should().Be(2);
        result.PresentToday.Should().Be(1);
        result.AbsentToday.Should().Be(1);
    }

    [Fact]
    public async Task EndBreakAsync_StaleBreakOnOldDate_EndsBreak()
    {
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var att = new Attendance
        {
            UserId = 1,
            Date = yesterday,
            ClockIn = yesterday.AddHours(8),
            Status = "break"
        };
        _context.Attendances.Add(att);
        _context.AttendanceBreaks.Add(new AttendanceBreak
        {
            AttendanceId = att.Id,
            Type = "cafe",
            StartTime = yesterday.AddHours(10),
            EndTime = null
        });
        await _context.SaveChangesAsync();

        var result = await _sut.EndBreakAsync(userId: 1);

        result.Success.Should().BeTrue();
    }
}
