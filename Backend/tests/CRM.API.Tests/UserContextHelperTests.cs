using Backend.Helpers;
using FluentAssertions;

namespace CRM.API.Tests;

public class UserContextHelperTests
{
    [Theory]
    [InlineData("ADMIN", "admin")]
    [InlineData("SuperAdmin", "admin")]
    [InlineData("QUALITE", "qualite")]
    [InlineData("ServiceQuality", "qualite")]
    [InlineData("AGENT", "agent")]
    [InlineData("TECH", "technique")]
    [InlineData("CONFIRMATRICE", "confirmatrice")]
    [InlineData(null, "")]
    public void NormalizeRole_MapsStoredRolesToModuleVocabulary(string? stored, string expected)
        => UserContextHelper.NormalizeRole(stored).Should().Be(expected);
}
