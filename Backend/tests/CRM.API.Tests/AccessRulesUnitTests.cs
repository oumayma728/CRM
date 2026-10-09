using System.Security.Claims;
using Backend.Authorization;
using Backend.Constants;
using Backend.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;

namespace CRM.API.Tests;

/// <summary>The small building blocks of the access rules, tested without any HTTP.</summary>
public class AccessRulesUnitTests
{
    private static ClaimsPrincipal User(string role, long id = 1) => new(new ClaimsIdentity(new[]
    {
        new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, role),
    }, "test"));

    // ── Permissions: admin = everything except the management of permissions ─────────────────

    [Fact]
    public void Admin_HasEveryPermission_ExceptTheManagementOfPermissions()
    {
        var admin = Permissions.RolePermissions["ADMIN"];

        admin.Should().Contain(new[] { Permissions.Clients.View, Permissions.Campaigns.Create, Permissions.Agents.ViewAll,
                                       Permissions.Agents.Manage, Permissions.Files.Upload, Permissions.ConfirmationClientAssign });
        admin.Should().NotContain(Permissions.Roles.AssignPermissions);
        admin.Should().NotContain(Permissions.Users.AssignPermissions);
    }

    [Fact]
    public void AllPermissions_AreFound_ByReflection()
    {
        var all = Permissions.All();
        all.Should().Contain(new[] { Permissions.Roles.AssignPermissions, Permissions.Clients.View, Permissions.AdminDashboard });
        all.Should().OnlyHaveUniqueItems();
        Permissions.RolePermissions["ADMIN"].Length.Should().Be(all.Length - Permissions.AdminDenied.Length);
    }

    [Fact]
    public void OtherRoles_KeepTheirNarrowPermissions()
    {
        Permissions.RolePermissions["AGENT"].Should().NotContain(Permissions.Clients.View);
        Permissions.RolePermissions["CONF1"].Should().OnlyContain(p => p.StartsWith("Confirmation1"));
    }

    // ── AdminAccessHandler: who passes a [Authorize(Roles = "...")] check ──────────────────────────

    private static async Task<bool> Passes(ClaimsPrincipal user, params string[] roles)
    {
        var requirement = new RolesAuthorizationRequirement(roles);
        var ctx = new AuthorizationHandlerContext(new[] { requirement }, user, null);
        await new AdminAccessHandler().HandleAsync(ctx);
        return ctx.HasSucceeded;
    }

    [Fact]
    public async Task SuperAdmin_PassesEveryRoleCheck_EvenOnesThatDoNotListHim()
    {
        (await Passes(User("SuperAdmin"), "AGENT")).Should().BeTrue();
        (await Passes(User("SuperAdmin"), "CONFIRMATRICE")).Should().BeTrue();
        (await Passes(User("SuperAdmin"), "SuperAdmin")).Should().BeTrue();
    }

    [Fact]
    public async Task Admin_PassesEveryRoleCheck_ExceptTheOnesReservedToTheSuperAdmin()
    {
        (await Passes(User("ADMIN"), "AGENT")).Should().BeTrue();
        (await Passes(User("ADMIN"), "TECH,QUALITE".Split(','))).Should().BeTrue();
        (await Passes(User("ADMIN"), "SuperAdmin")).Should().BeFalse("salaries are reserved to the SuperAdmin");
        (await Passes(User("ADMIN"), "SuperAdmin", "SuperAdmin")).Should().BeFalse();
    }

    [Fact]
    public async Task OtherRoles_AreNotHelpedByTheHandler()
    {
        // the handler only ever adds "yes" for admins; for the others the normal role check decides
        (await Passes(User("AGENT"), "ADMIN", "SuperAdmin")).Should().BeFalse();
        (await Passes(User("QUALITE"), "QUALITE")).Should().BeFalse("not handled here: the built-in handler says yes");
    }

    // ── helpers used by the controllers ──────────────────────────────────────────────────────────

    [Fact]
    public void AgentData_IsForTheAgentHimselfAndForAdmins()
    {
        UserContextHelper.CanAccessAgentData(User("AGENT", 7), 7).Should().BeTrue();
        UserContextHelper.CanAccessAgentData(User("AGENT", 7), 8).Should().BeFalse();
        UserContextHelper.CanAccessAgentData(User("ADMIN", 1), 8).Should().BeTrue();
        UserContextHelper.CanAccessAgentData(User("SuperAdmin", 1), 8).Should().BeTrue();
        UserContextHelper.CanAccessAgentData(User("QUALITE", 3), 8).Should().BeFalse();
    }

    [Fact]
    public void Salary_IsForTheSuperAdminAndTheAgentHimself_NotForAdmin()
    {
        UserContextHelper.CanSeeSalary(User("SuperAdmin", 1), 8).Should().BeTrue();
        UserContextHelper.CanSeeSalary(User("AGENT", 8), 8).Should().BeTrue();
        UserContextHelper.CanSeeSalary(User("ADMIN", 1), 8).Should().BeFalse();
        UserContextHelper.CanSeeSalary(User("AGENT", 9), 8).Should().BeFalse();
    }

    [Fact]
    public void OnlyTheSuperAdmin_CanManageASuperAdminAccount()
    {
        UserManagementGuard.CanManage(User("ADMIN"), "SuperAdmin").Should().BeFalse();
        UserManagementGuard.CanManage(User("SuperAdmin"), "SuperAdmin").Should().BeTrue();
        UserManagementGuard.CanManage(User("ADMIN"), "AGENT").Should().BeTrue();
        UserManagementGuard.IsSelf(User("ADMIN", 5), 5).Should().BeTrue();
        UserManagementGuard.IsSelf(User("ADMIN", 5), 6).Should().BeFalse();
    }
}
