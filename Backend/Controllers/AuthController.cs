using Microsoft.AspNetCore.Mvc;
using Backend.DTOs.Agent;
using Backend.Services.Auth;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Connexion — retourne un JWT token</summary>
    /// <remarks>
    /// Comptes de démonstration :
    /// - Agent : agent@ebi.com / role123
    /// - Admin : admin@ebi.com / role123
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDTO), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var response = await _authService.LoginAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Première connexion - changement de mot de passe obligatoire</summary>
    [HttpPost("first-login")]
    [ProducesResponseType(typeof(LoginResponseDTO), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> FirstLogin([FromBody] FirstLoginDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var response = await _authService.FirstLoginAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    
}