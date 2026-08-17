using CrmApi.Authorization;
using CrmApi.DTOs.Auth;
using CrmApi.Helpers;
using CrmApi.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IPermissionService _permissionService;

    public AuthController(IAuthService authService, IPermissionService permissionService)
    {
        _authService = authService;
        _permissionService = permissionService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try { return Ok(await _authService.LoginAsync(dto)); }
        catch (UnauthorizedAccessException) { return Unauthorized(new { error = "Invalid credentials" }); }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        try { return Ok(await _authService.GetCurrentUserAsync(UserContextHelper.GetUserId(User))); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents")]
    [Authorize]
    public async Task<IActionResult> GetAgents()
    {
        if (!UserContextHelper.IsAdminOrQualite(User) && !UserContextHelper.IsAgent(User)) return Forbid();
        try { return Ok(await _authService.GetAgentsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("users/create")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var (success, message) = await _authService.CreateUserAsync(dto);
            return success ? Ok(new { success, message }) : BadRequest(new { success, message });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpDelete("users/{userId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        try
        {
            var (success, message) = await _authService.DeleteUserAsync(userId);
            return success ? Ok(new { success, message }) : NotFound(new { success, message });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("users/{userId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var (success, message) = await _authService.UpdateUserAsync(userId, dto);
            return success ? Ok(new { success, message }) : BadRequest(new { success, message });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try { return Ok(await _authService.ForgotPasswordAsync(dto.Email)); }
        catch (KeyNotFoundException) { return NotFound(new { error = "Email not found" }); }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var (success, message) = await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
        return success ? Ok(new { success, message }) : BadRequest(new { success, message });
    }

    [HttpGet("permissions")]
    [Authorize]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = UserContextHelper.GetUserId(User);
        var perms = await _permissionService.GetUserPermissionsAsync(userId);
        return Ok(new { permissions = perms, role = UserContextHelper.GetRole(User) });
    }

    [HttpGet("roles/permissions")]
    [RequirePermission(Permissions.Roles.View)]
    public async Task<IActionResult> GetAllRolePermissions()
    {
        var perms = await _permissionService.GetAllRolePermissionsAsync();
        return Ok(perms);
    }

    [HttpPut("roles/permissions")]
    [RequirePermission(Permissions.Roles.AssignPermissions)]
    public async Task<IActionResult> SetRolePermission([FromBody] RolePermissionDto dto)
    {
        await _permissionService.SetRolePermissionAsync(dto.Role, dto.Permission, dto.Granted);
        return Ok(new { success = true });
    }
}
