using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;
using Backend.DTOs.Auth;
using Backend.Services.Permissions;
using Backend.Constants;
using System.Security.Cryptography;

namespace Backend.Services.Auth;

public class AuthService: IAuthService  
{
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly PasswordHasher _passwordHasher;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<AuthService> _logger;


    public AuthService(
        ApplicationDbContext dbContext,
        PasswordHasher passwordHasher,
        JwtTokenGenerator jwtTokenGenerator,
        IPermissionService permissionService,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _permissionService = permissionService;
        _logger = logger;
    }

    // ---------------- LOGIN ----------------
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var normalizedEmail = NormalizeEmail(request.Email);

        var user = await _dbContext.Users
            .Include(u => u.Role) 
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || user.IsDeleted || !user.IsActive)
        {
            _logger.LogWarning("Login rejected for email {Email}: user not found or inactive", normalizedEmail);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Verify password
        bool isValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isValid)
        {
            _logger.LogWarning("Login rejected for email {Email}: invalid credentials", normalizedEmail);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var accessToken = await _jwtTokenGenerator.GenerateAccessToken(user);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        var now = DateTime.UtcNow;
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = now.AddDays(7);
        user.LastLoginAt = now;
        user.UpdatedAt = now;
        user.IsOnline = true;
        user.PresenceStatus = user.Role?.Name == Roles.Agent
            ? AgentPresenceStatus.Available
            : AgentPresenceStatus.Offline;
        user.PresenceChangedAt = now;
        user.LastHeartbeatAt = now;
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),

            User = await MapUserDtoAsync(user)
        };
    }

    // ---------------- REGISTER ----------------
    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        if (request == null)
            throw new InvalidOperationException("Registration data is required");

        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("First name, last name, email, and password are required");
        }

        ValidatePasswordPolicy(request.Password);

        var normalizedEmail = NormalizeEmail(request.Email);

        if (await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            throw new InvalidOperationException("Email already registered");

        //Get the existing role from database, don't use request.Role directly
        Role? existingRole = null;

        if (request.Role != null && request.Role.Id > 0)
        {
            // Fetch the role from database (ATTACHED to context)
            existingRole = await _dbContext.Roles
                .FirstOrDefaultAsync(r => r.Id == request.Role.Id);
        }

        // If role not found, get default role (e.g., "Agent")
        if (existingRole == null)
        {
            existingRole = await _dbContext.Roles
                .FirstOrDefaultAsync(r => r.Name == "Agent");
        }

        if (existingRole == null)
        {
            throw new InvalidOperationException("No valid role found. Please ensure roles exist in database.");
        }

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            RoleId = existingRole.Id,  
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        // Load the role for the response
        await _dbContext.Entry(user)
            .Reference(u => u.Role)
            .LoadAsync();

        return await MapUserDtoAsync(user);
    }

    public async Task<UserDto> GetUserByIdAsync(int id)
    {
        var user = await _dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null || user.IsDeleted || !user.IsActive)
            throw new KeyNotFoundException($"User with ID {id} not found");

        return await MapUserDtoAsync(user);
    }
    // ---------------- GET CURRENT USER ----------------
    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.IsDeleted || !user.IsActive)
            throw new UnauthorizedAccessException();

        return await MapUserDtoAsync(user);
    }

    // ---------------- REFRESH TOKEN ----------------
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new UnauthorizedAccessException("Invalid or expired refresh token");

        var user = await _dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null ||
            user.IsDeleted ||
            !user.IsActive ||
            user.RefreshTokenExpiryTime == null ||
            user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var newAccessToken = await _jwtTokenGenerator.GenerateAccessToken(user);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Token refreshed",
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),

            User = await MapUserDtoAsync(user)
        };
    }

    // ---------------- LOGOUT ----------------
    public async Task LogoutAsync(int userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException();

        using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var now = DateTime.UtcNow;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        user.IsOnline = false;
        user.PresenceStatus = AgentPresenceStatus.Offline;
        user.PresenceChangedAt = now;
        user.LastHeartbeatAt = null;
        user.UpdatedAt = now;

        await ReleaseAssignedContactsAsync(userId, now);

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    // ---------------- FORGOT PASSWORD ----------------
    public async Task ForgetPasswordAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return;

        var normalizedEmail = NormalizeEmail(email);

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
            return;

        var token = GenerateSecureToken();
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

    }
    // ---------------- RESET PASSWORD ----------------

    public async Task<string> AdminResetPasswordAsync(int userId, int adminId)
    {
      
        var admin = await _dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == adminId);
        if (admin == null)
            throw new Exception("Admin not found");
        // Check if user has permission (both SuperAdmin and Admin have it)
        var hasPermission = await _permissionService.HasPermissionAsync(adminId, Backend.Constants.Permissions.Users.ResetPassword);
        if (!hasPermission)
            throw new UnauthorizedAccessException("You don't have permission to reset passwords");
        var targetUser = await _dbContext.Users
                                .Include(u => u.Role)
                                 .FirstOrDefaultAsync(u => u.Id == userId);
        if (targetUser == null || targetUser.IsDeleted || !targetUser.IsActive)
            throw new Exception("User not found");
        if (targetUser.Role?.Name == Roles.SuperAdmin && admin.Role?.Name != Roles.SuperAdmin)
        {
            throw new UnauthorizedAccessException("Cannot reset Super Admin password");
        }

        var tempPassword = GenerateRandomPassword();

        // Update user
        targetUser.PasswordHash = _passwordHasher.HashPassword(tempPassword);
        targetUser.MustChangePassword = true;
        targetUser.PasswordResetByUserId = adminId;
        targetUser.RefreshToken = null;
        targetUser.RefreshTokenExpiryTime = null;
        targetUser.UpdatedAt = DateTime.UtcNow;


        await _dbContext.SaveChangesAsync();
        _logger.LogInformation($"Admin {admin.Email} reset password for user {targetUser.Email}");

        return tempPassword; 
    }

    private string GenerateRandomPassword()
    {
        const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lower = "abcdefghijklmnopqrstuvwxyz";
        const string digits = "0123456789";
        const string symbols = "!@#$%";
        const string allChars = upper + lower + digits + symbols;

        var password = new char[12];
        password[0] = GetRandomChar(upper);
        password[1] = GetRandomChar(lower);
        password[2] = GetRandomChar(digits);
        password[3] = GetRandomChar(symbols);

        for (var i = 4; i < password.Length; i++)
        {
            password[i] = GetRandomChar(allChars);
        }

        Shuffle(password);
        return new string(password);
    }


    // ---------------- CHANGE PASSWORD ----------------
    public async Task ChangePasswordAsync(int userId, string oldPassword, string newPassword)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null || user.IsDeleted || !user.IsActive)
            throw new UnauthorizedAccessException();

        ValidatePasswordPolicy(newPassword);

        if (!_passwordHasher.VerifyPassword(oldPassword, user.PasswordHash))
            throw new UnauthorizedAccessException();

        if (_passwordHasher.VerifyPassword(newPassword, user.PasswordHash))
            throw new InvalidOperationException("New password must be different from the current password");

        user.PasswordHash = _passwordHasher.HashPassword(newPassword);
        user.MustChangePassword = false;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
    }

    private static string NormalizeEmail(string email)
        => email.Trim().ToLowerInvariant();

    private static void ValidatePasswordPolicy(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters long");
    }

    private async Task<UserDto> MapUserDtoAsync(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            RoleId = user.RoleId,
            RoleName = user.Role?.Name ?? "",
            Avatar = user.Avatar,
            IsOnline = user.IsOnline,
            PresenceStatus = user.PresenceStatus,
            PresenceChangedAt = user.PresenceChangedAt,
            LastHeartbeatAt = user.LastHeartbeatAt,
            Permissions = await _permissionService.GetUserPermissionsAsync(user.Id)
        };
    }

    private static string GenerateSecureToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    private static char GetRandomChar(string chars)
        => chars[RandomNumberGenerator.GetInt32(chars.Length)];

    private static void Shuffle(char[] chars)
    {
        for (var i = chars.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
    }

    private async Task ReleaseAssignedContactsAsync(int agentId, DateTime now)
    {
        await _dbContext.CallAttempts
            .Where(a => a.AgentId == agentId
                     && a.Status == CallStatus.Assigned
                     && a.EndedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, CallStatus.TimedOut)
                .SetProperty(a => a.EndedAt, now)
                .SetProperty(a => a.UpdatedAt, now));

        await _dbContext.CampaignFileContacts
            .Where(c => c.AssignedAgentId == agentId
                     && c.CallStatus == CallStatus.Assigned)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.CallStatus, CallStatus.Pending)
                .SetProperty(c => c.AssignedAgentId, (int?)null)
                .SetProperty(c => c.AssignedAt, (DateTime?)null));
    }
}
