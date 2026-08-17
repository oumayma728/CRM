using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CrmApi.Data;
using CrmApi.DTOs.Auth;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CrmApi.Services.Auth;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly ApplicationDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUnitOfWork uow, ApplicationDbContext context, IOptions<JwtSettings> jwtSettings)
    {
        _uow = uow;
        _context = context;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (user == null || !PasswordHasher.VerifyPassword(dto.Password, user.Password))
            throw new UnauthorizedAccessException("Invalid credentials");

        var token = JwtHelper.GenerateToken(user.Id, user.Username, user.Role.ToString().ToLower(), _jwtSettings);

        return new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Name = user.Name,
                Role = user.Role.ToString().ToLower(),
                Email = user.Email,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId) ?? throw new KeyNotFoundException("User not found");
        return new UserDto { Id = user.Id, Username = user.Username, Name = user.Name, Role = user.Role.ToString().ToLower(), Email = user.Email, CreatedAt = user.CreatedAt };
    }

    public async Task<List<UserDto>> GetAgentsAsync()
    {
        var users = await _uow.Users.FindAsync(u => u.Role == UserRole.Agent || u.Role == UserRole.Qualite);
        return users.Select(u => new UserDto { Id = u.Id, Username = u.Username, Name = u.Name, Role = u.Role.ToString().ToLower(), Email = u.Email, CreatedAt = u.CreatedAt }).ToList();
    }

    public async Task<(bool success, string message)> CreateUserAsync(CreateUserDto dto)
    {
        if (await _uow.Users.AnyAsync(u => u.Username == dto.Username))
            return (false, "Username already exists");
        if (dto.Email != null && await _uow.Users.AnyAsync(u => u.Email == dto.Email))
            return (false, "Email already exists");

        var role = Enum.Parse<UserRole>(dto.Role, true);
        var user = new User { Username = dto.Username, Password = PasswordHasher.HashPassword(dto.Password), Name = dto.Name, Role = role, Email = dto.Email ?? "" };
        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();
        return (true, "User created");
    }

    public async Task<(bool success, string message)> DeleteUserAsync(int userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return (false, "User not found");
        _uow.Users.Remove(user);
        await _uow.SaveChangesAsync();
        return (true, "User deleted");
    }

    public async Task<(bool success, string message)> UpdateUserAsync(int userId, UpdateUserDto dto)
    {
        var user = await _uow.Users.GetByIdAsync(userId) ?? throw new KeyNotFoundException("User not found");
        if (dto.Username != user.Username && await _uow.Users.AnyAsync(u => u.Username == dto.Username))
            return (false, "Username already exists");
        user.Username = dto.Username;
        user.Name = dto.Name;
        user.Role = Enum.Parse<UserRole>(dto.Role, true);
        user.Email = dto.Email ?? user.Email;
        if (!string.IsNullOrEmpty(dto.Password))
            user.Password = PasswordHasher.HashPassword(dto.Password);
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return (true, "User updated");
    }

    public async Task<ForgotPasswordDto> ForgotPasswordAsync(string email)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) throw new KeyNotFoundException("Email not found");
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return new ForgotPasswordDto { Email = email };
    }

    public async Task<(bool success, string message)> ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);
        if (user == null) return (false, "Invalid or expired token");
        user.Password = PasswordHasher.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return (true, "Password reset");
    }

    public string GenerateToken(int userId, string username, string role) => JwtHelper.GenerateToken(userId, username, role, _jwtSettings);

    public int? ValidateToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidAudience = _jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret))
            };
            var principal = handler.ValidateToken(token, parameters, out _);
            var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? principal.FindFirst("sub")?.Value;
            return int.TryParse(sub, out var id) ? id : null;
        }
        catch { return null; }
    }
}
