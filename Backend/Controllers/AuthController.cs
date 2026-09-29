using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.DTOs.Agent;
using Backend.Services.Auth;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _context;

    public AuthController(IAuthService authService, ApplicationDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    /// <summary>Profil de l'utilisateur connecté (restauration de session côté frontend)</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!long.TryParse(idClaim, out var userId)) return Unauthorized(new { message = "Token invalide." });

        var u = await _context.Utilisateurs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId && x.Actif);
        if (u == null) return Unauthorized(new { message = "Utilisateur introuvable." });

        return Ok(new
        {
            id = u.Id,
            userId = u.Id,
            username = u.Email,
            email = u.Email,
            nom = u.Nom,
            prenom = u.Prenom,
            name = $"{u.Prenom} {u.Nom}".Trim(),
            role = u.Role,
            typeConfirmatrice = u is Confirmatrice c ? c.Type.ToString() : null,
        });
    }

    /// <summary>Rôle normalisé + permissions (claims JWT) de l'utilisateur connecté</summary>
    [HttpGet("permissions")]
    [Authorize]
    public IActionResult MyPermissions() => Ok(new
    {
        role = UserContextHelper.GetRole(User),
        permissions = User.FindAll("permission").Select(c => c.Value).Distinct().ToList(),
    });

    /// <summary>Connexion — retourne un JWT + refresh token</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDTO), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
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

    /// <summary>Première connexion — activation du compte</summary>
    [HttpPost("first-login")]
    [ProducesResponseType(typeof(LoginResponseDTO), 200)]
    public async Task<IActionResult> FirstLogin([FromBody] FirstLoginDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
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

    /// <summary>Demande de réinitialisation du mot de passe (envoie un email)</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        // Always return 200 to not reveal whether email exists
        await _authService.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    /// <summary>Réinitialisation du mot de passe via token reçu par email</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Mot de passe réinitialisé avec succès." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Reset du mot de passe par l'admin (génère un mot de passe temporaire)</summary>
    [HttpPost("admin-reset-password")]
    [Authorize(Roles = "ADMIN,SuperAdmin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AdminResetPassword([FromBody] AdminResetPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var tempPassword = await _authService.AdminResetPasswordAsync(request.UserId);
            return Ok(new { message = "Mot de passe réinitialisé.", tempPassword });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Changement de mot de passe (utilisateur connecté)</summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Token invalide." });

        try
        {
            await _authService.ChangePasswordAsync(userId, request.OldPassword, request.NewPassword);
            return Ok(new { message = "Mot de passe changé avec succès." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Rafraîchir le JWT via refresh token</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(LoginResponseDTO), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Déconnexion — invalide le refresh token</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (long.TryParse(userIdClaim, out var userId))
            await _authService.LogoutAsync(userId);

        return Ok(new { message = "Déconnecté avec succès." });
    }

}
