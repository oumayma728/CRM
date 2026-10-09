using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace CRM.API.Tests.Integration;

/// <summary>
/// THE access rules of the application, written as a table and checked with the 9 role accounts:
///
///   SuperAdmin : everything.
///   Admin      : everything EXCEPT salaries and permissions.
///   Others     : only their own area (agent, confirmatrices, commercial, technique, qualité).
///   Nobody logged in : nothing (401).
///
/// "Allowed" means "the server does not answer 401/403" (the data itself is not what is tested here);
/// "denied" means exactly 403.
/// </summary>
public class AccessMatrixTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public AccessMatrixTests(ApiFactory factory) => _factory = factory;

    private static readonly string[] Supers = { "SuperAdmin" };
    private static readonly string[] Admins = { "SuperAdmin", "Admin" };
    private static readonly string[] AllConf = { "Conf1", "Conf2", "ConfClient" };

    // route -> roles allowed to open it (every other test account must get 403)
    public static IEnumerable<object[]> Rules()
    {
        // --- reserved to the SuperAdmin: salaries and permissions -----------------------------------------
        yield return new object[] { "/api/salaries", Supers };
        yield return new object[] { "/api/export/salaries", Supers };
        yield return new object[] { "/api/Permissions", Supers };
        // --- admins (SuperAdmin + Admin) ----------------------------------------------------------------------
        yield return new object[] { "/api/admin/dashboard", Admins };
        yield return new object[] { "/api/Clients", Admins };                // a permission-based route: Admin now has it
        yield return new object[] { "/api/Campaigns", Admins };
        yield return new object[] { "/api/leads", Admins.Concat(new[] { "Qualite" }).ToArray() };
        // --- services: the owner role + both admin roles --------------------------------------------------------
        yield return new object[] { "/api/confirmation1/dashboard", Admins.Concat(AllConf).ToArray() };
        yield return new object[] { "/api/confirmation2/dashboard", Admins.Concat(AllConf).ToArray() };
        yield return new object[] { "/api/confirmation-client/dashboard", Admins.Concat(AllConf).ToArray() };
        yield return new object[] { "/api/Commercial/stats", Admins.Concat(new[] { "Commercial" }).ToArray() };
        yield return new object[] { "/api/technique/dashboard", Admins.Concat(new[] { "Tech" }).ToArray() };
    }

    [Theory]
    [MemberData(nameof(Rules))]
    public async Task EachRole_GetsExactlyTheAccessItShouldHave(string route, string[] allowedRoles)
    {
        foreach (var (role, email) in TestHttp.AllRoles)
        {
            var client = await _factory.ClientFor(email);
            var status = (await client.GetAsync(route)).StatusCode;

            if (allowedRoles.Contains(role))
                status.Should().NotBe(HttpStatusCode.Forbidden, $"{role} must be allowed on {route}")
                      .And.NotBe(HttpStatusCode.Unauthorized, $"{role} is logged in on {route}");
            else
                status.Should().Be(HttpStatusCode.Forbidden, $"{role} must be refused on {route}");
        }
    }

    [Theory]
    [MemberData(nameof(Rules))]
    public async Task NobodyLoggedIn_IsRefusedEverywhere(string route, string[] _)
    {
        var res = await _factory.CreateClient().GetAsync(route);
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{route} must need a login");
    }

    [Fact]
    public async Task SuperAdmin_CanOpenEveryService_Admin_CanToo_ExceptSalariesAndPermissions()
    {
        // The two admin roles can open the pages of every service (they supervise everybody)...
        foreach (var email in new[] { ApiFactory.Accounts.SuperAdminEmail, ApiFactory.Accounts.AdminEmail })
        {
            var c = await _factory.ClientFor(email);
            foreach (var route in new[] { "/api/confirmation1/dashboard", "/api/Commercial/stats", "/api/technique/dashboard", "/api/Clients" })
                (await c.GetAsync(route)).StatusCode.Should().NotBe(HttpStatusCode.Forbidden, $"{email} on {route}");
        }

        // ...but only the SuperAdmin gets salaries and permissions
        var admin = await _factory.ClientFor(ApiFactory.Accounts.AdminEmail);
        (await admin.GetAsync("/api/salaries")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await admin.GetAsync("/api/Permissions")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task LeadTypes_And_Suppliers_CanBeManagedByAdminsAndTech_NotByAgents()
    {
        // These routes used to list the role names "Admin" and "ServiceTechnique", which do not exist:
        // nobody could create a lead type, so the file import was blocked on a clean installation.
        foreach (var email in new[] { ApiFactory.Accounts.SuperAdminEmail, ApiFactory.Accounts.AdminEmail, ApiFactory.Accounts.TechEmail })
        {
            var c = await _factory.ClientFor(email);
            var res = await c.PostAsJsonAsync("/api/LeadTypes", new { code = "PV", name = "Photovoltaïque", countryId = 1 });
            res.StatusCode.Should().NotBe(HttpStatusCode.Forbidden, $"{email} must be allowed to create a lead type");
        }
        var agent = await _factory.ClientFor(ApiFactory.Accounts.AgentEmail);
        (await agent.PostAsJsonAsync("/api/LeadTypes", new { code = "PV", name = "x", countryId = 1 })).StatusCode
            .Should().Be(HttpStatusCode.Forbidden);
    }
}
