using CrmApi.Controllers;
using CrmApi.Data;
using CrmApi.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class ExportControllerIntegrationTests : ControllerTestBase, IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<ExportController>> _mockLogger;
    private readonly ExportController _sut;

    public ExportControllerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"export_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();

        var user = new User
        {
            Id = 1, Name = "Alice", Username = "alice", Role = UserRole.Agent,
            Password = "hash", Email = "a@test.com", CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);

        _context.Calls.Add(new Call { Id = 1, AgentName = "Alice", CallDate = DateTime.UtcNow, Qualification = "RDV" });
        _context.Leads.Add(new Lead { Id = 1, ContactName = "Client", Email = "c@test.com" });
        _context.Attendances.Add(new Attendance { Id = 1, UserId = 1, Date = DateTime.UtcNow, Status = "active" });
        _context.Salaries.Add(new Salary { Id = 1, AgentId = 1, Month = "2026-06", TotalSalary = 3000 });
        _context.ManualEvaluations.Add(new ManualEvaluation { Id = 1, AgentId = 1, EvaluatorId = 1, GlobalScore = 80 });
        _context.SaveChanges();

        _mockLogger = new Mock<ILogger<ExportController>>(MockBehavior.Loose);

        _sut = new ExportController(_context, _mockLogger.Object);
        _sut.ControllerContext = CreateControllerContext(role: "admin");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task ExportCalls_Csv_ReturnsFile()
    {
        var result = await _sut.ExportCalls("csv", null);

        Assert.IsType<FileContentResult>(result);
        var file = (FileContentResult)result;
        file.ContentType.Should().Be("text/csv");
    }

    [Fact]
    public async Task ExportLeads_Csv_ReturnsFile()
    {
        var result = await _sut.ExportLeads("csv");
        Assert.IsType<FileContentResult>(result);
    }

    [Fact]
    public async Task ExportAttendance_Csv_ReturnsFile()
    {
        var result = await _sut.ExportAttendance("csv", null);
        Assert.IsType<FileContentResult>(result);
    }

    [Fact]
    public async Task ExportSalaries_Csv_ReturnsFile()
    {
        var result = await _sut.ExportSalaries("csv", "2026-06");
        Assert.IsType<FileContentResult>(result);
    }

    [Fact]
    public async Task ExportEvaluations_Csv_ReturnsFile()
    {
        var result = await _sut.ExportEvaluations("csv");
        Assert.IsType<FileContentResult>(result);
    }

    [Fact]
    public async Task ExportCalls_Xlsx_ReturnsExcel()
    {
        var result = await _sut.ExportCalls("xlsx", null);

        Assert.IsType<FileContentResult>(result);
        var file = (FileContentResult)result;
        file.ContentType.Should().Be("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
}
