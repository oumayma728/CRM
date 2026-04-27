using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Entities;
using Backend.DTOs.Auth;
namespace Backend.Services.Auth;

public class AuthService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly PasswordHasher _passwordHasher;

    public AuthService(
        ApplicationDbContext dbContext,
        PasswordHasher passwordHasher,
        JwtTokenGenerator jwtTokenGenerator)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    // ---------------- LOGIN ----------------
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var allUsers = await _dbContext.Users.ToListAsync();
        Console.WriteLine($"Total users in DB: {allUsers.Count}");
        foreach (var u in allUsers)
        {
            Console.WriteLine($"DB User: '{u.Email}' (ID: {u.Id})");
        }

        var user = await _dbContext.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new Exception("Invalid email or password");

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),

            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar
            }
        };
    }

    // ---------------- REGISTER ----------------
    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role,
            Avatar = user.Avatar
        };
    }

    // ---------------- GET CURRENT USER ----------------
    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException();

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role,
            Avatar = user.Avatar
        };
    }

    // ---------------- REFRESH TOKEN ----------------
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            throw new Exception("Invalid or expired refresh token");

        var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),

            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar
            }
        };
    }

    // ---------------- LOGOUT ----------------
    public async Task LogoutAsync(int userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException();

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await _dbContext.SaveChangesAsync();
    }

    // ---------------- CHANGE PASSWORD ----------------
    public async Task ChangePasswordAsync(int userId, string oldPassword, string newPassword)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException();

        if (!_passwordHasher.VerifyPassword(oldPassword, user.PasswordHash))
            throw new UnauthorizedAccessException();

        user.PasswordHash = _passwordHasher.HashPassword(newPassword);

        await _dbContext.SaveChangesAsync();
    }
}