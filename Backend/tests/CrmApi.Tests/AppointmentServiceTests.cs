using CrmApi.Data;
using CrmApi.DTOs.Appointment;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Appointment;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AppointmentServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly AppointmentService _sut;

    public AppointmentServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_appt_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _mockUow = new Mock<IUnitOfWork>();
        _sut = new AppointmentService(_context, _mockUow.Object);
    }

    [Fact]
    public async Task GetAppointmentsAsync_NoFilter_ReturnsAll()
    {
        var agent = new User { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(agent);
        _context.CrmAppointments.AddRange(
            new CrmAppointment { AgentId = 1, ClientName = "Client A", AppointmentDate = DateTime.UtcNow, AppointmentTime = "10:00", Agent = agent },
            new CrmAppointment { AgentId = 1, ClientName = "Client B", AppointmentDate = DateTime.UtcNow.AddDays(1), AppointmentTime = "14:00", Agent = agent }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetAppointmentsAsync(null, null);

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAppointmentsAsync_FilterByAgent_ReturnsFiltered()
    {
        var agent1 = new User { Id = 1, Username = "a1", Name = "A1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        var agent2 = new User { Id = 2, Username = "a2", Name = "A2", Role = UserRole.Agent, Password = "hash", Email = "b@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.AddRange(agent1, agent2);
        _context.CrmAppointments.AddRange(
            new CrmAppointment { AgentId = 1, ClientName = "C1", AppointmentDate = DateTime.UtcNow, AppointmentTime = "10:00", Agent = agent1 },
            new CrmAppointment { AgentId = 2, ClientName = "C2", AppointmentDate = DateTime.UtcNow, AppointmentTime = "12:00", Agent = agent2 }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetAppointmentsAsync(null, 1);

        result.Should().ContainSingle().Which.ClientName.Should().Be("C1");
    }

    [Fact]
    public async Task GetAppointmentByIdAsync_Existing_ReturnsDetail()
    {
        var agent = new User { Id = 1, Username = "a1", Name = "A1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(agent);
        var appointment = new CrmAppointment { AgentId = 1, ClientName = "Client", AppointmentDate = DateTime.UtcNow, AppointmentTime = "09:00", Agent = agent };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();

        var result = await _sut.GetAppointmentByIdAsync(appointment.Id);

        result.Should().NotBeNull();
        result!.ClientName.Should().Be("Client");
    }

    [Fact]
    public async Task GetAppointmentByIdAsync_NonExistent_ReturnsNull()
    {
        var result = await _sut.GetAppointmentByIdAsync(999);

        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAppointmentAsync_ValidDto_ReturnsSuccessWithScore()
    {
        var result = await _sut.CreateAppointmentAsync(1, new CreateAppointmentDto
        {
            ClientName = "New Client",
            ClientPhone = "0123456789",
            AppointmentDate = DateTime.UtcNow.AddDays(1),
            AppointmentTime = "10:00",
            Revenus = 50000,
            Chauffage = "gaz",
            Toiture = "tuile",
            Isolation = "non isole",
            Consommation = 350,
            CreditScore = 750,
            SituationBancaire = "bonne",
            ProjectType = "PV"
        });

        result.Success.Should().BeTrue();
        result.Id.Should().BeGreaterThan(0);
        result.QualityScore.Should().BeGreaterThan(0);
        result.Financing.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task UpdateAppointmentAsync_Existing_UpdatesAndRecalculates()
    {
        var agent = new User { Id = 1, Username = "a1", Name = "A1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(agent);
        var appointment = new CrmAppointment { AgentId = 1, ClientName = "Old", AppointmentDate = DateTime.UtcNow, AppointmentTime = "09:00", Agent = agent, Revenus = 10000, Chauffage = "gaz" };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();

        var (success, qualityScore) = await _sut.UpdateAppointmentAsync(appointment.Id, new UpdateAppointmentDto { ClientName = "Updated" });

        success.Should().BeTrue();
        qualityScore.Should().BeGreaterThan(0);
        var updated = await _context.CrmAppointments.FindAsync(appointment.Id);
        updated!.ClientName.Should().Be("Updated");
    }

    [Fact]
    public async Task UpdateAppointmentAsync_NonExistent_ThrowsKeyNotFound()
    {
        await _sut.Invoking(s => s.UpdateAppointmentAsync(999, new UpdateAppointmentDto { ClientName = "X" }))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateAppointmentAsync_InvalidStatus_ThrowsArgException()
    {
        var agent = new User { Id = 1, Username = "a1", Name = "A1", Role = UserRole.Agent, Password = "hash", Email = "a@b.com", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(agent);
        var appointment = new CrmAppointment { AgentId = 1, ClientName = "C", AppointmentDate = DateTime.UtcNow, AppointmentTime = "09:00", Agent = agent };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();

        await _sut.Invoking(s => s.UpdateAppointmentAsync(appointment.Id, new UpdateAppointmentDto { Status = "invalid_status" }))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task DeleteAppointmentAsync_Existing_ReturnsTrueAndRemoves()
    {
        var appointment = new CrmAppointment { AgentId = 1, ClientName = "C", AppointmentDate = DateTime.UtcNow, AppointmentTime = "09:00" };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();

        var result = await _sut.DeleteAppointmentAsync(appointment.Id);

        result.Should().BeTrue();
        var deleted = await _context.CrmAppointments.FindAsync(appointment.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAppointmentAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.DeleteAppointmentAsync(999);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAppointmentStatusAsync_ValidStatus_Updates()
    {
        var appointment = new CrmAppointment { AgentId = 1, ClientName = "C", AppointmentDate = DateTime.UtcNow, AppointmentTime = "09:00", Status = "pending" };
        _context.CrmAppointments.Add(appointment);
        await _context.SaveChangesAsync();

        var result = await _sut.UpdateAppointmentStatusAsync(appointment.Id, "confirmed");

        result.Should().BeTrue();
        var updated = await _context.CrmAppointments.FindAsync(appointment.Id);
        updated!.Status.Should().Be("confirmed");
    }

    [Fact]
    public async Task UpdateAppointmentStatusAsync_InvalidStatus_ThrowsArgException()
    {
        await _sut.Invoking(s => s.UpdateAppointmentStatusAsync(1, "bogus"))
            .Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpdateAppointmentStatusAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.UpdateAppointmentStatusAsync(999, "confirmed");

        result.Should().BeFalse();
    }
}
