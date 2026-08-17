using CrmApi.Controllers;
using CrmApi.DTOs.Attendance;
using CrmApi.Services.Attendance;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AttendanceControllerTests : ControllerTestBase
{
    private readonly Mock<IAttendanceService> _mockService;
    private readonly AttendanceController _sut;

    public AttendanceControllerTests()
    {
        _mockService = new Mock<IAttendanceService>(MockBehavior.Strict);
        _sut = new AttendanceController(_mockService.Object);
    }

    [Fact]
    public async Task ClockIn_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new ClockResultDto { Success = true, Message = "Clock-in recorded" };
        _mockService.Setup(s => s.ClockInAsync(1)).ReturnsAsync(expected);

        var result = await _sut.ClockIn();

        var val = OkValue<ClockResultDto>(result);
        val.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ClockOut_Success_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new ClockResultDto { Success = true, Message = "Clock-out recorded" };
        _mockService.Setup(s => s.ClockOutAsync(1)).ReturnsAsync(expected);

        var result = await _sut.ClockOut();

        var val = OkValue<ClockResultDto>(result);
        val.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ClockOut_NoActive_ReturnsBadRequest()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new ClockResultDto { Success = false, Message = "No active attendance" };
        _mockService.Setup(s => s.ClockOutAsync(1)).ReturnsAsync(expected);

        var result = await _sut.ClockOut();

        AssertBadRequest(result);
    }

    [Fact]
    public async Task StartBreak_ValidType_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var dto = new BreakRequestDto { Type = "pause" };
        var expected = new ClockResultDto { Success = true, Message = "Break started" };
        _mockService.Setup(s => s.StartBreakAsync(1, "pause")).ReturnsAsync(expected);

        var result = await _sut.StartBreak(dto);

        var val = OkValue<ClockResultDto>(result);
        val.Success.Should().BeTrue();
    }

    [Fact]
    public async Task StartBreak_NullType_ReturnsBadRequest()
    {
        var result = await _sut.StartBreak(new BreakRequestDto { Type = "" });

        AssertBadRequest(result);
    }

    [Fact]
    public async Task EndBreak_Success_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new ClockResultDto { Success = true, Message = "Break ended" };
        _mockService.Setup(s => s.EndBreakAsync(1)).ReturnsAsync(expected);

        var result = await _sut.EndBreak();

        var val = OkValue<ClockResultDto>(result);
        val.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetStatus_ReturnsStatus()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1);
        var expected = new AttendanceStatusDto { Status = "active", ClockIn = DateTime.UtcNow.AddHours(-2) };
        _mockService.Setup(s => s.GetStatusAsync(1)).ReturnsAsync(expected);

        var result = await _sut.GetStatus();

        var val = OkValue<AttendanceStatusDto>(result);
        val.Status.Should().Be("active");
    }

    [Fact]
    public async Task GetReport_Admin_ReturnsReport()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<AttendanceReportDto> { new() { UserName = "A1", Status = "active" } };
        _mockService.Setup(s => s.GetReportAsync()).ReturnsAsync(expected);

        var result = await _sut.GetReport();

        var val = OkValue<List<AttendanceReportDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetReport_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.GetReport();

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetTeamDetail_Admin_ReturnsDetail()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<TeamAttendanceDetailDto> { new() { UserName = "A1", Status = "active" } };
        _mockService.Setup(s => s.GetTeamAttendanceDetailAsync()).ReturnsAsync(expected);

        var result = await _sut.GetTeamDetail();

        var val = OkValue<List<TeamAttendanceDetailDto>>(result);
        val.Should().ContainSingle();
    }
}
