using CrmApi.Helpers;
using FluentAssertions;

namespace CrmApi.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void HashPassword_ReturnsHashedString()
    {
        var hash = PasswordHasher.HashPassword("testpassword");

        hash.Should().NotBeNullOrEmpty();
        hash.Should().NotBe("testpassword");
        hash.Should().StartWith("$2");
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        var hash = PasswordHasher.HashPassword("correctpassword");

        var result = PasswordHasher.VerifyPassword("correctpassword", hash);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WrongPassword_ReturnsFalse()
    {
        var hash = PasswordHasher.HashPassword("correctpassword");

        var result = PasswordHasher.VerifyPassword("wrongpassword", hash);

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_PlainTextFallback_ReturnsTrueForExactMatch()
    {
        var result = PasswordHasher.VerifyPassword("plaintext", "plaintext");

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_PlainTextFallback_ReturnsFalseForMismatch()
    {
        var result = PasswordHasher.VerifyPassword("password", "different_plaintext");

        result.Should().BeFalse();
    }

    [Fact]
    public void HashPassword_DifferentPasswords_DifferentHashes()
    {
        var hash1 = PasswordHasher.HashPassword("password1");
        var hash2 = PasswordHasher.HashPassword("password2");

        hash1.Should().NotBe(hash2);
    }
}
