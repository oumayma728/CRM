using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;

namespace CrmApi.Tests.Security;

public class SecurityTests
{
    private readonly JwtSettings _jwtSettings = new()
    {
        Secret = "crm_ai_secret_key_2026_stable_do_not_change",
        ExpirationHours = 24,
        Issuer = "crm-api",
        Audience = "crm-api-users",
    };

    private string GenerateToken(string role, int userId = 1, int expiryHours = 24)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, "testuser"),
            new Claim(ClaimTypes.Role, role),
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var handler = new JwtSecurityTokenHandler();

        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidAudience = _jwtSettings.Audience,
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero,
            }, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    [Fact]
    public void JwtToken_AdminRole_ContainsAdminClaim()
    {
        var token = GenerateToken("admin");
        var principal = ValidateToken(token);

        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.Role)?.Value.Should().Be("admin");
    }

    [Fact]
    public void JwtToken_AgentRole_ContainsAgentClaim()
    {
        var token = GenerateToken("agent");
        var principal = ValidateToken(token);

        principal.Should().NotBeNull();
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("agent");
    }

    [Fact]
    public void JwtToken_ExpiredToken_ReturnsNull()
    {
        var token = GenerateToken("admin", expiryHours: -1);

        var principal = ValidateToken(token);

        principal.Should().BeNull();
    }

    [Fact]
    public void JwtToken_InvalidSignature_ReturnsNull()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("different_secret_key_that_does_not_match"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(ClaimTypes.Role, "admin") };
        var token = new JwtSecurityToken(issuer: _jwtSettings.Issuer, audience: _jwtSettings.Audience,
            claims: claims, expires: DateTime.UtcNow.AddHours(1), signingCredentials: creds);
        var badToken = new JwtSecurityTokenHandler().WriteToken(token);

        var principal = ValidateToken(badToken);

        principal.Should().BeNull();
    }

    [Fact]
    public void JwtToken_WrongIssuer_ReturnsNull()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(ClaimTypes.Role, "admin") };
        var token = new JwtSecurityToken(issuer: "wrong-issuer", audience: _jwtSettings.Audience,
            claims: claims, expires: DateTime.UtcNow.AddHours(1), signingCredentials: creds);
        var badToken = new JwtSecurityTokenHandler().WriteToken(token);

        var principal = ValidateToken(badToken);

        principal.Should().BeNull();
    }

    [Fact]
    public void JwtToken_WrongAudience_ReturnsNull()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(ClaimTypes.Role, "admin") };
        var token = new JwtSecurityToken(issuer: _jwtSettings.Issuer, audience: "wrong-audience",
            claims: claims, expires: DateTime.UtcNow.AddHours(1), signingCredentials: creds);
        var badToken = new JwtSecurityTokenHandler().WriteToken(token);

        var principal = ValidateToken(badToken);

        principal.Should().BeNull();
    }

    [Fact]
    public void JwtToken_MalformedToken_ReturnsNull()
    {
        var principal = ValidateToken("not.a.jwt");
        principal.Should().BeNull();
    }

    [Fact]
    public void UserContextHelper_GetUserId_ReturnsCorrectId()
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "42") };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        var id = UserContextHelper.GetUserId(principal);

        id.Should().Be(42);
    }

    [Fact]
    public void UserContextHelper_GetUserId_NoClaim_ReturnsZero()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        var id = UserContextHelper.GetUserId(principal);

        id.Should().Be(0);
    }

    [Fact]
    public void UserContextHelper_IsAdminOrQualite_Admin_ReturnsTrue()
    {
        var claims = new[] { new Claim("role", "admin") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        UserContextHelper.IsAdminOrQualite(principal).Should().BeTrue();
    }

    [Fact]
    public void UserContextHelper_IsAdminOrQualite_Agent_ReturnsFalse()
    {
        var claims = new[] { new Claim("role", "agent") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        UserContextHelper.IsAdminOrQualite(principal).Should().BeFalse();
    }

    [Fact]
    public void UserContextHelper_IsAdmin_Admin_ReturnsTrue()
    {
        var claims = new[] { new Claim(ClaimTypes.Role, "admin") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        UserContextHelper.IsAdmin(principal).Should().BeTrue();
    }

    [Fact]
    public void UserContextHelper_IsAdmin_Qualite_ReturnsFalse()
    {
        var claims = new[] { new Claim(ClaimTypes.Role, "qualite") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        UserContextHelper.IsAdmin(principal).Should().BeFalse();
    }

    [Fact]
    public void UserContextHelper_IsAgent_Agent_ReturnsTrue()
    {
        var claims = new[] { new Claim("role", "agent") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        UserContextHelper.IsAgent(principal).Should().BeTrue();
    }

    [Fact]
    public void PasswordHasher_BcryptHash_VerifiesCorrectly()
    {
        var password = "SecureP@ss123";
        var hash = PasswordHasher.HashPassword(password);

        PasswordHasher.VerifyPassword(password, hash).Should().BeTrue();
    }

    [Fact]
    public void PasswordHasher_WrongPassword_ReturnsFalse()
    {
        var hash = PasswordHasher.HashPassword("correctpass");

        PasswordHasher.VerifyPassword("wrongpass", hash).Should().BeFalse();
    }

    [Fact]
    public void PasswordHasher_GeneratedHashes_AreUnique()
    {
        var hash1 = PasswordHasher.HashPassword("samepassword");
        var hash2 = PasswordHasher.HashPassword("samepassword");

        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void PasswordHasher_NullPlaintext_ReturnsFalse()
    {
        PasswordHasher.VerifyPassword(null!, "hash").Should().BeFalse();
    }

    [Fact]
    public void PasswordHasher_NullHash_ReturnsFalse()
    {
        PasswordHasher.VerifyPassword("password", null!).Should().BeFalse();
    }
}
