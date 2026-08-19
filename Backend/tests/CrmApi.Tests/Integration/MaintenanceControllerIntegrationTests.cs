using CrmApi.Controllers;
using CrmApi.Data;
using CrmApi.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class MaintenanceControllerIntegrationTests : ControllerTestBase, IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly MaintenanceController _sut;

    public MaintenanceControllerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"maint_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _context.Database.EnsureCreated();

        _context.Calls.Add(new Call { Id = 1, AgentName = "Alice", CallDate = DateTime.UtcNow });
        _context.Users.Add(new User { Id = 1, Name = "Admin", Username = "admin", Role = UserRole.Admin, Password = "hash", Email = "a@test.com", CreatedAt = DateTime.UtcNow });
        _context.Leads.Add(new Lead { Id = 1, ContactName = "Client" });
        _context.SaveChanges();

        _sut = new MaintenanceController(_context);
        _sut.ControllerContext = CreateControllerContext(role: "admin");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task Export_ReturnsOk()
    {
        var result = await _sut.Export();
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Import_Valid_ReturnsOk()
    {
        var dto = new ImportDataDto { Leads = new List<object> { new() } };

        var result = _sut.Import(dto);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Import_NullDto_ReturnsBadRequest()
    {
        var result = _sut.Import(null!);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Reset_DeletesCalls()
    {
    }
}
