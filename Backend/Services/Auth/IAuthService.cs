using Backend.DTOs.Agent;

namespace Backend.Services.Auth;

public interface IAuthService
{
    Task<LoginResponseDTO> LoginAsync(LoginDTO dto);
    Task<LoginResponseDTO> FirstLoginAsync(FirstLoginDTO dto);
}