using CrmApi.Data;
using CrmApi.DTOs.Auth;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class AuthServiceTests
{
    private readonly AuthService _sut;
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly Mock<IRepository<User>> _mockUserRepo;
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly JwtSettings _jwtSettings;

    public AuthServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_auth_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);

        _mockUserRepo = new Mock<IRepository<User>>();
        _mockUow = new Mock<IUnitOfWork>();
        _mockUow.Setup(u => u.Users).Returns(_mockUserRepo.Object);

        _jwtSettings = new JwtSettings
        {
            Secret = "test_secret_key_for_unit_tests_only_1234567890",
            ExpirationHours = 24,
            Issuer = "test-issuer",
            Audience = "test-audience"
        };

        var mockOptions = Options.Create(_jwtSettings);
        _sut = new AuthService(_mockUow.Object, _context, mockOptions);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsToken()
    {
        var password = PasswordHasher.HashPassword("testpass");
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Password = password,
            Name = "Test User",
            Role = UserRole.Admin,
            Email = "test@test.com",
            CreatedAt = DateTime.UtcNow
        };
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(user);

        var result = await _sut.LoginAsync(new LoginDto { Username = "testuser", Password = "testpass" });

        result.Token.Should().NotBeNullOrEmpty();
        result.User.Username.Should().Be("testuser");
        result.User.Role.Should().Be("admin");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorized()
    {
        var password = PasswordHasher.HashPassword("correctpass");
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(new User { Id = 1, Username = "testuser", Password = password, Name = "Test", Role = UserRole.Agent, Email = "" });

        await FluentActions.Invoking(() => _sut.LoginAsync(new LoginDto { Username = "testuser", Password = "wrongpass" }))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_NonExistentUser_ThrowsUnauthorized()
    {
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        await FluentActions.Invoking(() => _sut.LoginAsync(new LoginDto { Username = "nobody", Password = "pass" }))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetCurrentUserAsync_ExistingUser_ReturnsUserDto()
    {
        _mockUserRepo.Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(new User { Id = 1, Username = "testuser", Name = "Test", Role = UserRole.Agent, Email = "test@test.com", CreatedAt = DateTime.UtcNow });

        var result = await _sut.GetCurrentUserAsync(1);

        result.Username.Should().Be("testuser");
        result.Name.Should().Be("Test");
        result.Role.Should().Be("agent");
    }

    [Fact]
    public async Task GetCurrentUserAsync_NonExistentUser_ThrowsKeyNotFound()
    {
        _mockUserRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((User?)null);

        await FluentActions.Invoking(() => _sut.GetCurrentUserAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task GetAgentsAsync_ReturnsOnlyAgentsAndQualite()
    {
        var users = new List<User>
        {
            new() { Id = 1, Username = "admin", Name = "Admin", Role = UserRole.Admin, Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 3, Username = "qualite", Name = "Qualite", Role = UserRole.Qualite, Email = "", CreatedAt = DateTime.UtcNow }
        };
        _mockUserRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(users.Where(u => u.Role is UserRole.Agent or UserRole.Qualite).ToList());

        var result = await _sut.GetAgentsAsync();

        result.Should().HaveCount(2);
        result.Should().Contain(u => u.Username == "agent1");
        result.Should().Contain(u => u.Username == "qualite");
        result.Should().NotContain(u => u.Username == "admin");
    }

    [Fact]
    public async Task CreateUserAsync_DuplicateUsername_ReturnsFalse()
    {
        _mockUserRepo.Setup(r => r.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(true);

        var (success, message) = await _sut.CreateUserAsync(new CreateUserDto
        {
            Username = "existing",
            Password = "pass",
            Name = "Existing",
            Role = "agent"
        });

        success.Should().BeFalse();
        message.Should().Be("Username already exists");
    }

    [Fact]
    public async Task CreateUserAsync_NewUser_ReturnsTrue()
    {
        _mockUserRepo.Setup(r => r.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(false);

        var (success, message) = await _sut.CreateUserAsync(new CreateUserDto
        {
            Username = "newuser",
            Password = "pass123",
            Name = "New User",
            Role = "agent",
            Email = "new@test.com"
        });

        success.Should().BeTrue();
        message.Should().Be("User created");
    }

    [Fact]
    public async Task DeleteUserAsync_NonExistentUser_ReturnsFalse()
    {
        _mockUserRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((User?)null);

        var (success, message) = await _sut.DeleteUserAsync(999);

        success.Should().BeFalse();
        message.Should().Be("User not found");
    }

    [Fact]
    public async Task DeleteUserAsync_ExistingUser_ReturnsTrue()
    {
        _mockUserRepo.Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(new User { Id = 1, Username = "todelete", Name = "To Delete", Role = UserRole.Agent, Email = "", Password = "hash", CreatedAt = DateTime.UtcNow });

        var (success, message) = await _sut.DeleteUserAsync(1);

        success.Should().BeTrue();
        message.Should().Be("User deleted");
    }

    [Fact]
    public async Task ForgotPasswordAsync_ExistingEmail_ReturnsDto()
    {
        var user = new User { Id = 1, Email = "test@test.com", Username = "test", Name = "Test", Role = UserRole.Agent, Password = "hash" };
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(user);

        var result = await _sut.ForgotPasswordAsync("test@test.com");

        result.Email.Should().Be("test@test.com");
        user.ResetToken.Should().NotBeNull();
        user.ResetTokenExpiry.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task ForgotPasswordAsync_NonExistentEmail_ThrowsKeyNotFound()
    {
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        await FluentActions.Invoking(() => _sut.ForgotPasswordAsync("nonexistent@test.com"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task ResetPasswordAsync_ValidToken_ResetsPassword()
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        var user = new User
        {
            Id = 1,
            Username = "test",
            Name = "Test",
            Role = UserRole.Agent,
            Password = "oldhash",
            ResetToken = token,
            ResetTokenExpiry = DateTime.UtcNow.AddMinutes(10)
        };
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync(user);

        var (success, message) = await _sut.ResetPasswordAsync(token, "newpassword");

        success.Should().BeTrue();
        message.Should().Be("Password reset");
        user.Password.Should().NotBe("oldhash");
        user.ResetToken.Should().BeNull();
    }

    [Fact]
    public async Task ResetPasswordAsync_ExpiredToken_ReturnsFalse()
    {
        var token = "expired-token";
        _mockUserRepo.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        var (success, message) = await _sut.ResetPasswordAsync(token, "newpassword");

        success.Should().BeFalse();
        message.Should().Be("Invalid or expired token");
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwt()
    {
        var token = _sut.GenerateToken(1, "testuser", "admin");

        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void ValidateToken_ValidToken_ReturnsUserId()
    {
        var token = _sut.GenerateToken(42, "testuser", "agent");

        var userId = _sut.ValidateToken(token);

        userId.Should().Be(42);
    }

    [Fact]
    public void ValidateToken_InvalidToken_ReturnsNull()
    {
        var userId = _sut.ValidateToken("invalid.token.here");

        userId.Should().BeNull();
    }
}
