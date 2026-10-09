using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.DTOs.Agent;
using Backend.Services.Auth;
using Backend.Data;
using Backend.Entities;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Backend.Attributes;
using Backend.Authorization;
using Backend.DTOs.Admin;
using Backend.Services.Admin;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _context;
    private readonly IAdminService _adminService;

    public AuthController(IAuthService authService, ApplicationDbContext context, IAdminService adminService)
    {
        _authService = authService;
        _context = context;
        _adminService = adminService;
    }

    // ── Gestion rapide agents / qualité (pages Agents & Dashboard, contrat khaled-dev-v3) ──
    // Le CRUD complet de tous les rôles reste dans AdminController (/api/admin/utilisateurs).

    public record QuickUserCreateDto(string? Username, string? Password, string? Name, string? Role, string? Email);
    public record QuickUserUpdateDto(string? Name, string? Email, string? Password);

    private static (string prenom, string nom) SplitName(string? name)
    {
        var parts = (name ?? "").Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch { 0 => ("", ""), 1 => (parts[0], ""), _ => (parts[0], parts[1]) };
    }

    /// <summary>Agents et superviseurs qualité actifs</summary>
    [HttpGet("agents")]
    [Authorize]
    [SnakeCaseJson]
    public async Task<IActionResult> GetAgents()
    {
        var users = await _context.Users.AsNoTracking()
            .Where(u => u.Actif && (u.Role == "AGENT" || u.Role == "QUALITE"))
            .OrderBy(u => u.Nom)
            .ToListAsync();
        return Ok(users.Select(u => new
        {
            u.Id,
            Username = u.Email,
            Name = $"{u.Prenom} {u.Nom}".Trim(),
            Role = u.Role.ToLowerInvariant(),
            u.Email,
            CreatedAt = u.DateCreation,
        }));
    }

    [HttpPost("users/create")]
    [Authorize(Roles = "ADMIN,SuperAdmin")]
    [SnakeCaseJson]
    public async Task<IActionResult> CreateQuickUser([FromBody] QuickUserCreateDto dto)
    {
        var email = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email! : dto.Username ?? "";
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { detail = "Email et mot de passe requis." });
        if (await _context.Users.AnyAsync(u => u.Email == email))
            return BadRequest(new { detail = "Cet email est déjà utilisé." });

        var (prenom, nom) = SplitName(dto.Name);
        var created = await _adminService.CreateUtilisateurAsync(new UtilisateurRequestDTO
        {
            Nom = nom, Prenom = prenom, Email = email, MotDePasse = dto.Password!, Role = dto.Role ?? "agent",
        });
        return Ok(new { success = true, message = "Utilisateur créé", user_id = created.Id });
    }

    [HttpPut("users/{userId:long}")]
    [Authorize(Roles = "ADMIN,SuperAdmin")]
    [SnakeCaseJson]
    public async Task<IActionResult> UpdateQuickUser(long userId, [FromBody] QuickUserUpdateDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { detail = "Utilisateur introuvable." });

        // An admin must not be able to rewrite the e-mail / password of the super admin and log in as him.
        if (!UserManagementGuard.CanManage(User, user.Role))
            return StatusCode(StatusCodes.Status403Forbidden, new { detail = UserManagementGuard.SuperAdminOnlyMessage });

        if (!string.IsNullOrWhiteSpace(dto.Name)) (user.Prenom, user.Nom) = SplitName(dto.Name);
        if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email!;
        if (!string.IsNullOrWhiteSpace(dto.Password)) user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Utilisateur mis à jour" });
    }

    [HttpDelete("users/{userId:long}")]
    [Authorize(Roles = "ADMIN,SuperAdmin")]
    [SnakeCaseJson]
    public async Task<IActionResult> DeleteQuickUser(long userId)
    {
        if (UserManagementGuard.IsSelf(User, userId))
            return BadRequest(new { detail = UserManagementGuard.CannotDeactivateSelfMessage });

        var targetRole = await _context.Users.AsNoTracking()
            .Where(u => u.Id == userId).Select(u => u.Role).FirstOrDefaultAsync();
        if (targetRole != null && !UserManagementGuard.CanManage(User, targetRole))
            return StatusCode(StatusCodes.Status403Forbidden, new { detail = UserManagementGuard.SuperAdminOnlyMessage });

        try
        {
            await _adminService.DeleteUtilisateurAsync(userId);
            return Ok(new { success = true, message = "Utilisateur désactivé" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    /// <summary>Profil de l'utilisateur connecté (restauration de session côté frontend)</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!long.TryParse(idClaim, out var userId)) return Unauthorized(new { message = "Token invalide." });

        var u = await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId && x.Actif);
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
    [EnableRateLimiting("login")]
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
    [EnableRateLimiting("login")]
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
    [EnableRateLimiting("login")]
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
    [EnableRateLimiting("login")]
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

        // The reply contains the new temporary password: resetting the super admin's password
        // would hand the account over to the caller.
        var targetRole = await _context.Users.AsNoTracking()
            .Where(u => u.Id == request.UserId).Select(u => u.Role).FirstOrDefaultAsync();
        if (targetRole != null && !UserManagementGuard.CanManage(User, targetRole))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = UserManagementGuard.SuperAdminOnlyMessage });

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
