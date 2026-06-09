using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.DTOs.Auth;    
using Backend.Services.Auth;
using System.Security.Claims;   
using Backend.DTOs;
using Backend.Services.SourceFiles;
using Backend.Entities;
using Backend.Constants;
using Backend.Attributes;
using Backend.Services;
using Backend.Services.Permissions;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger, IPermissionService permissionService)
        {
            _permissionService = permissionService;
            _authService = authService;
            _logger = logger;
        }
        //to avoid duplicating userId
        private int? GetCurrentUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login failed for email: {Email}", request.Email);
                return StatusCode(500, new { message = "Login failed. Please try again." });
            }
        }

        [HttpPost("register")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<ActionResult<UserDto>> Register(RegisterRequest request)
        {
            try
            {
                var user = await _authService.RegisterAsync(request);
                return Ok(user);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();
            var user = await _authService.GetUserByIdAsync(userId.Value);
            return Ok(user);
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> RefreshToken(RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request?.RefreshToken))
                return BadRequest(new { message = "Refresh token is required" });

            try
            {
                var result = await _authService.RefreshTokenAsync(request.RefreshToken);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Refresh token failed");
                return StatusCode(500, new { message = "Token refresh failed. Please try again." });
            }
        }


        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            await _authService.LogoutAsync(userId.Value);
            return Ok(new { message = "Logged out successfully" });
        }
        [HttpGet("me/permissions")]
        [RequirePermission(Permissions.Users.View)]
        public async Task<ActionResult<List<string>>> GetMyPermissions()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();
            var permissions = await _permissionService.GetUserPermissionsAsync(userId.Value);
            return Ok(permissions);

        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword(ChangePasswordRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();
                await _authService.ChangePasswordAsync(userId.Value, request.OldPassword, request.NewPassword);
                return Ok(new { message = "Password changed successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<ActionResult> ForgetPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { message = "Email is required" });

                await _authService.ForgetPasswordAsync(request.Email);
                return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in forgot password for email: {Email}", request.Email);
                return StatusCode(500, new { message = "An error occurred while processing your request. Please try again later." });
            }

        }

        [HttpPost("reset-password")]
        [Authorize]
        [RequirePermission(Permissions.Users.ResetPassword)]
        public async Task<ActionResult> AdminResetPassword(int userId)
        {
            try
            {
                var adminId = GetCurrentUserId();
                if (adminId == null)
                    return Unauthorized();
                var tempPassword = await _authService.AdminResetPasswordAsync(userId , adminId.Value);  
                return Ok(new { message = "Password reset successfully", tempPassword });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
