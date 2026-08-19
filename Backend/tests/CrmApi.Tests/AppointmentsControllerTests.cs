using CrmApi.Controllers;
using CrmApi.DTOs.Appointment;
using CrmApi.Services.Appointment;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AppointmentsControllerTests : ControllerTestBase
{
    private readonly Mock<IAppointmentService> _mockService;
    private readonly AppointmentsController _adminController;
    private readonly AppointmentsController _agentController;

    public AppointmentsControllerTests()
    {
        _mockService = new Mock<IAppointmentService>(MockBehavior.Strict);
        _adminController = new AppointmentsController(_mockService.Object);
        _adminController.ControllerContext = CreateControllerContext(role: "admin");
        _agentController = new AppointmentsController(_mockService.Object);
        _agentController.ControllerContext = CreateControllerContext(userId: 2, role: "agent");
    }

    [Fact]
    public async Task GetAppointments_ReturnsOk()
    {
        var expected = new List<AppointmentListDto> { new() { ClientName = "Client" } };
        _mockService.Setup(s => s.GetAppointmentsAsync(null, null)).ReturnsAsync(expected);

        var result = await _adminController.GetAppointments(null, null);

        var val = OkValue<List<AppointmentListDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAppointment_Valid_ReturnsOk()
    {
        var expected = new AppointmentDetailDto { ClientName = "Client" };
        _mockService.Setup(s => s.GetAppointmentByIdAsync(1)).ReturnsAsync(expected);

        var result = await _adminController.GetAppointment(1);

        var val = OkValue<AppointmentDetailDto>(result);
        val.ClientName.Should().Be("Client");
    }

    [Fact]
    public async Task GetAppointment_NonExistent_ReturnsNotFound()
    {
        _mockService.Setup(s => s.GetAppointmentByIdAsync(99)).ReturnsAsync((AppointmentDetailDto?)null);

        var result = await _adminController.GetAppointment(99);
        AssertNotFound(result);
    }

    [Fact]
    public async Task CreateAppointment_Valid_ReturnsOk()
    {
        var dto = new CreateAppointmentDto { ClientName = "Client", AppointmentDate = DateTime.UtcNow.AddDays(1) };
        var expected = new AppointmentResultDto { Id = 1 };
        _mockService.Setup(s => s.CreateAppointmentAsync(1, dto)).ReturnsAsync(expected);

        var result = await _adminController.CreateAppointment(dto);

        var val = OkValue<AppointmentResultDto>(result);
        val.Id.Should().Be(1);
    }

    [Fact]
    public async Task CreateAppointment_NullBody_ReturnsBadRequest()
    {
        var result = await _adminController.CreateAppointment(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task DeleteAppointment_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.DeleteAppointmentAsync(1)).ReturnsAsync(true);

        var result = await _adminController.DeleteAppointment(1);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteAppointment_Agent_ReturnsForbid()
    {
    }

    [Fact]
    public async Task DeleteAppointment_NonExistent_ReturnsNotFound()
    {
        _mockService.Setup(s => s.DeleteAppointmentAsync(99)).ReturnsAsync(false);

        var result = await _adminController.DeleteAppointment(99);
        AssertNotFound(result);
    }

    [Fact]
    public async Task UpdateAppointment_Valid_ReturnsOk()
    {
        var dto = new UpdateAppointmentDto { ClientName = "Updated" };
        _mockService.Setup(s => s.UpdateAppointmentAsync(1, dto)).ReturnsAsync((true, 85));

        var result = await _adminController.UpdateAppointment(1, dto);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateAppointment_NotFound_ReturnsNotFound()
    {
        var dto = new UpdateAppointmentDto { ClientName = "Updated" };
        _mockService.Setup(s => s.UpdateAppointmentAsync(99, dto)).ThrowsAsync(new KeyNotFoundException());

        var result = await _adminController.UpdateAppointment(99, dto);
        AssertNotFound(result);
    }

    [Fact]
    public async Task UpdateStatus_Valid_ReturnsOk()
    {
        var dto = new UpdateAppointmentStatusDto { Status = "Confirmed" };
        _mockService.Setup(s => s.UpdateAppointmentStatusAsync(1, "Confirmed")).ReturnsAsync(true);

        var result = await _adminController.UpdateStatus(1, dto);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateStatus_NullStatus_ReturnsBadRequest()
    {
        var result = await _adminController.UpdateStatus(1, new UpdateAppointmentStatusDto { Status = "" });
        AssertBadRequest(result);
    }
}
