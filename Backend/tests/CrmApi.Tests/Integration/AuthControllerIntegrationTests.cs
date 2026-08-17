using CrmApi.Controllers;
using CrmApi.DTOs.Auth;
using CrmApi.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class AuthControllerIntegrationTests : ControllerTestBase
{
    private readonly Mock<IAuthService> _mockService;
    private readonly Mock<IPermissionService> _mockPermission;
    private readonly AuthController _adminController;

    public AuthControllerIntegrationTests()
    {
        _mockService = CreateMockService<IAuthService>();
        _mockPermission = CreateMockService<IPermissionService>();
        _adminController = CreateController(() => new AuthController(_mockService.Object, _mockPermission.Object), role: "admin");
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        var response = new AuthResponseDto
        {
            Token = "jwt-token",
            User = new UserDto { Id = 1, Username = "admin", Name = "Admin", Role = "admin", Email = "admin@test.com" }
        };
        _mockService.Setup(s => s.LoginAsync(It.IsAny<LoginDto>())).ReturnsAsync(response);

        var result = await _adminController.Login(new LoginDto { Username = "admin", Password = "admin123" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        value.Token.Should().Be("jwt-token");
        value.User.Username.Should().Be("admin");
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401()
    {
        _mockService.Setup(s => s.LoginAsync(It.IsAny<LoginDto>())).ThrowsAsync(new UnauthorizedAccessException());

        var result = await _adminController.Login(new LoginDto { Username = "bad", Password = "bad" });

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal(401, unauthorized.StatusCode);
    }

    [Fact]
    public async Task GetMe_Authenticated_Returns200()
    {
        _mockService.Setup(s => s.GetCurrentUserAsync(1)).ReturnsAsync(
            new UserDto { Id = 1, Username = "admin", Name = "Admin", Role = "admin" });

        var result = await _adminController.GetMe();

        var value = OkValue<UserDto>(result);
        value.Username.Should().Be("admin");
    }

    [Fact]
    public async Task GetMe_UserNotFound_Returns404()
    {
        _mockService.Setup(s => s.GetCurrentUserAsync(1)).ThrowsAsync(new KeyNotFoundException("User not found"));

        var result = await _adminController.GetMe();
        AssertNotFound(result);
    }

    [Fact]
    public async Task GetAgents_Admin_Returns200()
    {
        _mockService.Setup(s => s.GetAgentsAsync()).ReturnsAsync(
            new List<UserDto> { new() { Id = 2, Username = "agent1", Name = "Agent", Role = "agent" } });

        var result = await _adminController.GetAgents();

        var value = OkValue<List<UserDto>>(result);
        value.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateUser_Admin_Returns200()
    {
        var dto = new CreateUserDto { Username = "newuser", Password = "pass", Name = "New", Role = "agent" };
        _mockService.Setup(s => s.CreateUserAsync(dto)).ReturnsAsync((true, "User created"));

        var result = await _adminController.CreateUser(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.Value.Should().BeEquivalentTo(new { success = true, message = "User created" });
    }

    [Fact]
    public async Task CreateUser_Duplicate_Returns400()
    {
        var dto = new CreateUserDto { Username = "existing", Password = "pass", Name = "Existing", Role = "agent" };
        _mockService.Setup(s => s.CreateUserAsync(dto)).ReturnsAsync((false, "Username already exists"));

        var result = await _adminController.CreateUser(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        bad.Value.Should().BeEquivalentTo(new { success = false, message = "Username already exists" });
    }

    [Fact]
    public async Task DeleteUser_Admin_Existing_Returns200()
    {
        _mockService.Setup(s => s.DeleteUserAsync(5)).ReturnsAsync((true, "User deleted"));

        var result = await _adminController.DeleteUser(5);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteUser_Admin_NotFound_Returns404()
    {
        _mockService.Setup(s => s.DeleteUserAsync(999)).ReturnsAsync((false, "User not found"));

        var result = await _adminController.DeleteUser(999);
        AssertNotFound(result);
    }

    [Fact]
    public async Task ForgotPassword_ExistingEmail_Returns200()
    {
        _mockService.Setup(s => s.ForgotPasswordAsync("test@test.com"))
            .ReturnsAsync(new ForgotPasswordDto { Email = "test@test.com" });

        var result = await _adminController.ForgotPassword(new ForgotPasswordDto { Email = "test@test.com" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var value = Assert.IsType<ForgotPasswordDto>(ok.Value);
        value.Email.Should().Be("test@test.com");
    }

    [Fact]
    public async Task ForgotPassword_NonExistentEmail_Returns404()
    {
        _mockService.Setup(s => s.ForgotPasswordAsync("unknown@test.com")).ThrowsAsync(new KeyNotFoundException());

        var result = await _adminController.ForgotPassword(new ForgotPasswordDto { Email = "unknown@test.com" });
        AssertNotFound(result);
    }

    [Fact]
    public async Task ResetPassword_ValidToken_Returns200()
    {
        _mockService.Setup(s => s.ResetPasswordAsync("valid-token", "newpass"))
            .ReturnsAsync((true, "Password reset"));

        var result = await _adminController.ResetPassword(new ResetPasswordDto { Token = "valid-token", NewPassword = "newpass" });
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ResetPassword_InvalidToken_Returns400()
    {
        _mockService.Setup(s => s.ResetPasswordAsync("bad-token", "newpass"))
            .ReturnsAsync((false, "Invalid or expired token"));

        var result = await _adminController.ResetPassword(new ResetPasswordDto { Token = "bad-token", NewPassword = "newpass" });
        AssertBadRequest(result);
    }
}
