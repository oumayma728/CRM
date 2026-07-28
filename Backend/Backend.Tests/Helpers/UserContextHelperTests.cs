using System.Security.Claims;
using Backend.Helpers;

namespace Backend.Tests.Helpers;

public class UserContextHelperTests
{
    private static ClaimsPrincipal MakeUser(string? role = null, string? id = "1", string? name = "testuser")
    {
        var claims = new List<Claim>();
        if (id != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, id));
        if (name != null) claims.Add(new Claim(ClaimTypes.Name, name));
        if (role != null) claims.Add(new Claim("role", role));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }

    [Fact]
    public void GetUserId_HasNameIdentifier_ReturnsParsedInt()
    {
        var user = MakeUser(id: "42");
        Assert.Equal(42, UserContextHelper.GetUserId(user));
    }

    [Fact]
    public void GetUserId_FallsbackToSub()
    {
        var claims = new List<Claim> { new("sub", "99"), new(ClaimTypes.Name, "x") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
        Assert.Equal(99, UserContextHelper.GetUserId(user));
    }

    [Fact]
    public void GetUserId_MissingId_ReturnsZero()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(Array.Empty<Claim>(), "test"));
        Assert.Equal(0, UserContextHelper.GetUserId(user));
    }

    [Fact]
    public void GetRole_FromRoleClaim()
    {
        var user = MakeUser(role: "admin");
        Assert.Equal("admin", UserContextHelper.GetRole(user));
    }

    [Fact]
    public void IsAdmin_ReturnsTrue()
    {
        Assert.True(UserContextHelper.IsAdmin(MakeUser(role: "admin")));
        Assert.False(UserContextHelper.IsAdmin(MakeUser(role: "agent")));
    }

    [Fact]
    public void IsAdminOrQualite_ReturnsTrueForBoth()
    {
        Assert.True(UserContextHelper.IsAdminOrQualite(MakeUser(role: "admin")));
        Assert.True(UserContextHelper.IsAdminOrQualite(MakeUser(role: "qualite")));
        Assert.False(UserContextHelper.IsAdminOrQualite(MakeUser(role: "agent")));
    }

    [Fact]
    public void IsAgent_ReturnsTrue()
    {
        Assert.True(UserContextHelper.IsAgent(MakeUser(role: "agent")));
        Assert.False(UserContextHelper.IsAgent(MakeUser(role: "admin")));
    }
}
