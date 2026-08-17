using CrmApi.DTOs.Auth;

namespace CrmApi.Services.Auth;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserDto> GetCurrentUserAsync(int userId);
    Task<List<UserDto>> GetAgentsAsync();
    Task<(bool success, string message)> CreateUserAsync(CreateUserDto dto);
    Task<(bool success, string message)> DeleteUserAsync(int userId);
    Task<(bool success, string message)> UpdateUserAsync(int userId, UpdateUserDto dto);
    Task<ForgotPasswordDto> ForgotPasswordAsync(string email);
    Task<(bool success, string message)> ResetPasswordAsync(string token, string newPassword);
    string GenerateToken(int userId, string username, string role);
    int? ValidateToken(string token);
}
