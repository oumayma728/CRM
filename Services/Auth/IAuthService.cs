using Backend.DTOs.Auth;

namespace Backend.Services.Auth
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<UserDto> RegisterAsync(RegisterRequest request);
        Task<UserDto> GetCurrentUserAsync(int userId);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(int userId);
        Task ChangePasswordAsync(int userId, string oldPassword, string newPassword);
        Task<UserDto> GetUserByIdAsync(int id);
    }
}
