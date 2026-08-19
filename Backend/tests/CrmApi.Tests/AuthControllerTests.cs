using CrmApi.Controllers;
using CrmApi.DTOs.Auth;
using CrmApi.Services.Auth;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AuthControllerTests : ControllerTestBase
{
    private readonly Mock<IAuthService> _mockService;
    private readonly Mock<IPermissionService> _mockPermission;
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        _mockService = new Mock<IAuthService>(MockBehavior.Strict);
        _mockPermission = new Mock<IPermissionService>(MockBehavior.Strict);
        _sut = new AuthController(_mockService.Object, _mockPermission.Object);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOk()
    {
        var dto = new LoginDto { Username = "admin", Password = "pass" };
        var expected = new AuthResponseDto { Token = "jwt", User = new UserDto { Username = "admin" } };
        _mockService.Setup(s => s.LoginAsync(dto)).ReturnsAsync(expected);

        var result = await _sut.Login(dto);

        var ok = OkValue<AuthResponseDto>(result);
        ok.Token.Should().Be("jwt");
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        _mockService.Setup(s => s.LoginAsync(It.IsAny<LoginDto>())).ThrowsAsync(new UnauthorizedAccessException());

        var result = await _sut.Login(new LoginDto());

        var obj = Assert.IsType<UnauthorizedObjectResult>(result);
        obj.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task GetMe_Authorized_ReturnsUser()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1, role: "admin");
        _mockService.Setup(s => s.GetCurrentUserAsync(1)).ReturnsAsync(new UserDto { Username = "admin", Name = "Admin" });

        var result = await _sut.GetMe();

        var user = OkValue<UserDto>(result);
        user.Username.Should().Be("admin");
    }

    [Fact]
    public async Task GetMe_NotFound_Returns404()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 999);
        _mockService.Setup(s => s.GetCurrentUserAsync(999)).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.GetMe();

        AssertNotFound(result);
    }

    [Fact]
    public async Task GetAgents_Admin_ReturnsList()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.GetAgentsAsync()).ReturnsAsync(new List<UserDto> { new() { Username = "a1" }, new() { Username = "a2" } });

        var result = await _sut.GetAgents();

        var agents = OkValue<List<UserDto>>(result);
        agents.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAgents_Agent_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 5, role: "agent");
        _mockService.Setup(s => s.GetAgentsAsync()).ReturnsAsync(new List<UserDto>());

        var result = await _sut.GetAgents();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CreateUser_Duplicate_ReturnsBadRequest()
    {
        _sut.ControllerContext = CreateControllerContext(userId: 1, role: "admin");
        _mockService.Setup(s => s.CreateUserAsync(It.IsAny<CreateUserDto>())).ReturnsAsync((false, "Username already exists"));

        var result = await _sut.CreateUser(new CreateUserDto());

        AssertBadRequest(result);
    }

    [Fact]
    public async Task CreateUser_NullBody_ReturnsBadRequest()
    {
        var result = await _sut.CreateUser(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task ForgotPassword_ExistingEmail_ReturnsDto()
    {
        _mockService.Setup(s => s.ForgotPasswordAsync("test@test.com")).ReturnsAsync(new ForgotPasswordDto { Email = "test@test.com" });

        var result = await _sut.ForgotPassword(new ForgotPasswordDto { Email = "test@test.com" });

        var dto = OkValue<ForgotPasswordDto>(result);
        dto.Email.Should().Be("test@test.com");
    }

    [Fact]
    public async Task ForgotPassword_NonExistent_ReturnsNotFound()
    {
        _mockService.Setup(s => s.ForgotPasswordAsync("missing@test.com")).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.ForgotPassword(new ForgotPasswordDto { Email = "missing@test.com" });

        AssertNotFound(result);
    }

    [Fact]
    public async Task DeleteUser_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteUserAsync(1)).ReturnsAsync((true, "User deleted"));

        var result = await _sut.DeleteUser(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task DeleteUser_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteUserAsync(999)).ReturnsAsync((false, "User not found"));

        var result = await _sut.DeleteUser(999);

        AssertNotFound(result);
    }

}
