using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.API.Tests.Integration;

/// <summary>
/// The technique service used to read the OLD "Pointages" table (only the dialer pauses), so its pointage page and its
/// dashboard counter never showed the real clock-ins. It now uses the same data as the admin pages.
/// </summary>
public class TechniquePointageTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public TechniquePointageTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task TechniqueDashboard_CountsThePeopleWhoClockedInToday_FromTheRealAttendanceTable()
    {
        var tech = await _factory.ClientFor(ApiFactory.Accounts.TechEmail);
        var before = (await tech.GetFromJsonAsync<JsonElement>("/api/technique/dashboard")).GetProperty("pointagesAujourd").GetInt32();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            // two different people clocked in today (one of them twice: counted once) + somebody who clocked in yesterday
            db.AdvancedAttendances.AddRange(
                new AdvancedAttendance { UserId = ApiFactory.Accounts.AgentId, Date = today, ClockIn = DateTime.UtcNow.AddHours(-3), ClockOut = DateTime.UtcNow.AddHours(-2), Status = "completed" },
                new AdvancedAttendance { UserId = ApiFactory.Accounts.AgentId, Date = today, ClockIn = DateTime.UtcNow.AddHours(-1), Status = "active" },
                new AdvancedAttendance { UserId = ApiFactory.Accounts.Agent2Id, Date = today, ClockIn = DateTime.UtcNow.AddHours(-1), Status = "active" },
                new AdvancedAttendance { UserId = ApiFactory.Accounts.QualiteId, Date = today.AddDays(-1), ClockIn = DateTime.UtcNow.AddDays(-1), Status = "completed" });
            await db.SaveChangesAsync();
        }

        var after = (await tech.GetFromJsonAsync<JsonElement>("/api/technique/dashboard")).GetProperty("pointagesAujourd").GetInt32();
        (after - before).Should().Be(2, "two different people clocked in today; yesterday does not count");
    }

    [Fact]
    public async Task Technique_CanReadTheTeamAttendanceUsedByTheSharedPointagePage_ButAnAgentCannot()
    {
        var tech = await _factory.ClientFor(ApiFactory.Accounts.TechEmail);
        (await tech.GetAsync("/api/attendance/team-detail")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await tech.GetAsync("/api/attendance/report")).StatusCode.Should().Be(HttpStatusCode.OK);

        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        (await agent.GetAsync("/api/attendance/team-detail")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await agent.GetAsync("/api/attendance/report")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Theory]
    [InlineData("/api/technique/pointage")]
    [InlineData("/api/admin/pointage")]
    public async Task TheOldPointageEndpoints_ThatReadTheWrongTable_AreGone(string url)
    {
        var admin = await _factory.ClientFor(ApiFactory.Accounts.SuperAdminEmail);
        (await admin.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
