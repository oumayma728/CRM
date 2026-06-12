using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using Backend.DTOs.Agent;
using Backend.Services.Permission;
using Backend.Entities;
using AgentEntity = Backend.Entities.Agent;

namespace Backend.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly IPermissionService _permissionService;  // AJOUTER

    // Modifier le constructeur
    public AuthService(ApplicationDbContext context, IConfiguration config, IPermissionService permissionService)
    {
        _context = context;
        _config = config;
        _permissionService = permissionService;  // AJOUTER
    }

    public async Task<LoginResponseDTO> LoginAsync(LoginDTO dto)
    {
        // 1. Trouver l'utilisateur par email
        var utilisateur = await _context.Set<Utilisateur>()
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Actif);

        if (utilisateur == null)
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect.");

        // 2. Vérification spéciale pour les comptes en attente
        if (utilisateur.Statut == "EN_ATTENTE")
            throw new UnauthorizedAccessException("COMPTE_EN_ATTENTE:Veuillez changer votre mot de passe.");

        // 3. Vérifier le mot de passe
        bool motDePasseValide = BCrypt.Net.BCrypt.Verify(dto.MotDePasse, utilisateur.MotDePasse);
        if (!motDePasseValide)
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect.");

        // 4. Vérification empreinte PC pour les agents
        if (utilisateur is AgentEntity agent && dto.IdentifiantMachine != null)
        {
            if (agent.IdentifiantMachine == null)
            {
                agent.IdentifiantMachine = dto.IdentifiantMachine;
            }
            else if (agent.IdentifiantMachine != dto.IdentifiantMachine)
            {
                throw new UnauthorizedAccessException(
                    "Connexion refusée depuis ce poste. Contactez l'administration.");
            }
        }

        // 5. Mettre à jour dernière connexion
        utilisateur.DerniereConnexion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // 6. Générer JWT avec le rôle CONFIRMATRICE pour toutes les confirmatrices
        var token = await GenererTokenAsync(utilisateur);
        var expiration = DateTime.UtcNow.AddHours(8);

        return new LoginResponseDTO
        {
            Token = token,
            Role = utilisateur.Role,
            TypeConfirmatrice = utilisateur is Confirmatrice c ? c.Type.ToString() : null,
            UserId = utilisateur.Id,
            Nom = utilisateur.Nom,
            Prenom = utilisateur.Prenom,
            Email = utilisateur.Email,
            Expiration = expiration
        };
    }

    // MODIFIER: Rendre cette méthode async et ajouter IPermissionService
    private async Task<string> GenererTokenAsync(Utilisateur utilisateur, string? customRole = null)
    {
        var jwtKey = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret manquant dans appsettings.json");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Utiliser le rôle personnalisé si fourni, sinon le rôle de l'utilisateur
        var role = customRole ?? utilisateur.Role;

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, utilisateur.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, utilisateur.Email),
            new Claim(ClaimTypes.Role, role),
            new Claim("nom", utilisateur.Nom),
            new Claim("prenom", utilisateur.Prenom),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Ajouter le type spécifique pour les confirmatrices
        if (utilisateur is Confirmatrice confirmatrice)
        {
            claims.Add(new Claim("typeConfirmatrice", confirmatrice.Type.ToString()));
        }

        // Récupérer les permissions (en utilisant _permissionService injecté)
        try
        {
            var permissions = await _permissionService.GetUserPermissionsAsync((int)utilisateur.Id);
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }
        }
        catch (Exception ex)
        {
            // Si les permissions ne sont pas encore initialisées, continuer sans
            Console.WriteLine($"Erreur lors de la récupération des permissions: {ex.Message}");
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Garder la méthode GenererToken synchrone pour FirstLoginAsync
    private string GenererToken(Utilisateur utilisateur, string? customRole = null)
    {
        var jwtKey = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret manquant dans appsettings.json");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var role = customRole ?? utilisateur.Role;

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, utilisateur.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, utilisateur.Email),
            new Claim(ClaimTypes.Role, role),
            new Claim("nom", utilisateur.Nom),
            new Claim("prenom", utilisateur.Prenom),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (utilisateur is Confirmatrice confirmatrice)
        {
            claims.Add(new Claim("typeConfirmatrice", confirmatrice.Type.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<LoginResponseDTO> FirstLoginAsync(FirstLoginDTO dto)
    {
        var utilisateur = await _context.Set<Utilisateur>()
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Actif);

        if (utilisateur == null)
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect.");

        bool motDePasseValide = BCrypt.Net.BCrypt.Verify(dto.MotDePasseTemporaire, utilisateur.MotDePasse);
        if (!motDePasseValide)
            throw new UnauthorizedAccessException("Mot de passe temporaire incorrect.");

        if (utilisateur.Statut != "EN_ATTENTE")
            throw new InvalidOperationException("Ce compte n'est pas en attente d'activation.");

        utilisateur.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.NouveauMotDePasse);
        utilisateur.Statut = "ACTIF";
        utilisateur.DerniereConnexion = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var token = GenererToken(utilisateur);

        return new LoginResponseDTO
        {
            Token = token,
            Role = utilisateur.Role,
            TypeConfirmatrice = utilisateur is Confirmatrice conf ? conf.Type.ToString() : null,
            UserId = utilisateur.Id,
            Nom = utilisateur.Nom,
            Prenom = utilisateur.Prenom,
            Email = utilisateur.Email,
            Expiration = DateTime.UtcNow.AddHours(8)
        };
    }
}