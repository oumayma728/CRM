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

        public AuthController(IAuthService authService, ILogger<AuthController> logger , IPermissionService permissionService)
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
                Console.WriteLine($"=== LOGIN REQUEST ===");
                Console.WriteLine($"Email: {request.Email}");

                var result = await _authService.LoginAsync(request);
                return Ok(result);
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
        }
    }
}