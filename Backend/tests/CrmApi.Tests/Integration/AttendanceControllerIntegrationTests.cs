using CrmApi.Controllers;
using CrmApi.DTOs.Attendance;
using CrmApi.Services.Attendance;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class AttendanceControllerIntegrationTests : ControllerTestBase
{
    private readonly Mock<IAttendanceService> _mockService;
    private readonly AttendanceController _adminController;
    private readonly AttendanceController _agentController;

    public AttendanceControllerIntegrationTests()
    {
        _mockService = CreateMockService<IAttendanceService>();
        _adminController = CreateController(() => new AttendanceController(_mockService.Object), role: "admin");
        _agentController = CreateController(() => new AttendanceController(_mockService.Object), userId: 2, role: "agent");
    }

    [Fact]
    public async Task ClockIn_ReturnsOk()
    {
        _mockService.Setup(s => s.ClockInAsync(1)).ReturnsAsync(new ClockResultDto { Success = true, AttendanceId = 1 });

        var result = await _adminController.ClockIn();

        var value = OkValue<ClockResultDto>(result);
        value.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ClockIn_AlreadyClockedIn_ReturnsBadRequest()
    {
        _mockService.Setup(s => s.ClockInAsync(1)).ThrowsAsync(new InvalidOperationException("Already clocked in"));

        var result = await _adminController.ClockIn();

        AssertBadRequest(result);
    }

    [Fact]
    public async Task ClockOut_ActiveSession_ReturnsOk()
    {
        _mockService.Setup(s => s.ClockOutAsync(1)).ReturnsAsync(new ClockResultDto { Success = true, Message = "Clocked out" });

        var result = await _adminController.ClockOut();

        var value = OkValue<ClockResultDto>(result);
        value.Message.Should().Be("Clocked out");
    }

    [Fact]
    public async Task ClockOut_NoActiveSession_ReturnsBadRequest()
    {
        _mockService.Setup(s => s.ClockOutAsync(1)).ReturnsAsync(new ClockResultDto { Success = false, Message = "No active attendance" });

        var result = await _adminController.ClockOut();

        AssertBadRequest(result);
    }

    [Fact]
    public async Task StartBreak_ValidType_ReturnsOk()
    {
        var dto = new BreakRequestDto { Type = "Pause déjeuner" };
        _mockService.Setup(s => s.StartBreakAsync(1, "Pause déjeuner"))
            .ReturnsAsync(new ClockResultDto { Success = true });

        var result = await _adminController.StartBreak(dto);

        var value = OkValue<ClockResultDto>(result);
        value.Success.Should().BeTrue();
    }

    [Fact]
    public async Task StartBreak_NullDto_ReturnsBadRequest()
    {
        var result = await _adminController.StartBreak(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task StartBreak_EmptyType_ReturnsBadRequest()
    {
        var result = await _adminController.StartBreak(new BreakRequestDto { Type = "" });
        AssertBadRequest(result);
    }

    [Fact]
    public async Task EndBreak_ActiveBreak_ReturnsOk()
    {
        _mockService.Setup(s => s.EndBreakAsync(1))
            .ReturnsAsync(new ClockResultDto { Success = true });

        var result = await _adminController.EndBreak();

        var value = OkValue<ClockResultDto>(result);
        value.Success.Should().BeTrue();
    }

    [Fact]
    public async Task EndBreak_NoBreak_ReturnsBadRequest()
    {
        _mockService.Setup(s => s.EndBreakAsync(1))
            .ReturnsAsync(new ClockResultDto { Success = false, Message = "No break in progress" });

        var result = await _adminController.EndBreak();
        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetStatus_ReturnsOk()
    {
        _mockService.Setup(s => s.GetStatusAsync(1))
            .ReturnsAsync(new AttendanceStatusDto { Status = "active", ClockIn = DateTime.UtcNow });

        var result = await _adminController.GetStatus();

        var value = OkValue<AttendanceStatusDto>(result);
        value.Status.Should().Be("active");
    }

    [Fact]
    public async Task GetReport_Admin_ReturnsOk()
    {
        var report = new List<AttendanceReportDto> { new() { UserName = "Agent", Date = DateTime.UtcNow } };
        _mockService.Setup(s => s.GetReportAsync()).ReturnsAsync(report);

        var result = await _adminController.GetReport();

        var value = OkValue<List<AttendanceReportDto>>(result);
        value.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetReport_Agent_ReturnsForbid()
    {
        var result = await _agentController.GetReport();
        AssertForbid(result);
    }

    [Fact]
    public async Task UpdateAttendance_Admin_ReturnsOk()
    {
        var dto = new UpdateAttendanceDto { Status = "active" };
        _mockService.Setup(s => s.UpdateAttendanceAsync(2, dto)).ReturnsAsync(true);

        var result = await _adminController.UpdateAttendance(2, dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.Value.Should().BeEquivalentTo(new { success = true });
    }

    [Fact]
    public async Task UpdateAttendance_NotFound_Returns404()
    {
        var dto = new UpdateAttendanceDto { Status = "active" };
        _mockService.Setup(s => s.UpdateAttendanceAsync(999, dto)).ReturnsAsync(false);

        var result = await _adminController.UpdateAttendance(999, dto);
        AssertNotFound(result);
    }

    [Fact]
    public async Task GetTeamStatus_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetTeamStatusAsync())
            .ReturnsAsync(new TeamStatusDto());

        var result = await _adminController.GetTeamStatus();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTeamReport_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetTeamReportAsync())
            .ReturnsAsync(new TeamReportDto());

        var result = await _adminController.GetTeamReport();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTeamDetail_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetTeamAttendanceDetailAsync())
            .ReturnsAsync(new List<TeamAttendanceDetailDto>());

        var result = await _adminController.GetTeamDetail();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task TeamEndpoints_WithMock_ReturnsOk()
    {
        _mockService.Setup(s => s.GetTeamStatusAsync())
            .ReturnsAsync(new TeamStatusDto());
        _mockService.Setup(s => s.GetTeamReportAsync())
            .ReturnsAsync(new TeamReportDto());
        _mockService.Setup(s => s.GetTeamAttendanceDetailAsync())
            .ReturnsAsync(new List<TeamAttendanceDetailDto>());

        var status = await _adminController.GetTeamStatus();
        Assert.IsType<OkObjectResult>(status);

        var report = await _adminController.GetTeamReport();
        Assert.IsType<OkObjectResult>(report);

        var detail = await _adminController.GetTeamDetail();
        Assert.IsType<OkObjectResult>(detail);
    }
}
