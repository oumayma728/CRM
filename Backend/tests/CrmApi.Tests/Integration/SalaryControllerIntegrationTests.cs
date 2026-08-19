using CrmApi.Controllers;
using CrmApi.DTOs.Salary;
using CrmApi.Services.Salary;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests.Integration;

public class SalaryControllerIntegrationTests : ControllerTestBase
{
    private readonly Mock<ISalaryService> _mockService;
    private readonly SalaryController _adminController;
    private readonly SalaryController _agentController;

    public SalaryControllerIntegrationTests()
    {
        _mockService = CreateMockService<ISalaryService>();
        _adminController = CreateController(() => new SalaryController(_mockService.Object), role: "admin");
        _agentController = CreateController(() => new SalaryController(_mockService.Object), userId: 2, role: "agent");
    }

    [Fact]
    public async Task GetSalaries_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetSalariesAsync(null)).ReturnsAsync(new List<SalaryDto>());

        var result = await _adminController.GetSalaries(null);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetSalaries_Agent_ReturnsForbid()
    {
        var result = await _agentController.GetSalaries(null);
        AssertForbid(result);
    }

    [Fact]
    public async Task GetMonthlySummary_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetMonthlySummaryAsync(null)).ReturnsAsync(new MonthlySummaryDto());

        var result = await _adminController.GetMonthlySummary(null);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Calculate_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.CalculateAllSalariesAsync("2026-06"))
            .ReturnsAsync(new List<SalaryCalculationDto>());

        var result = await _adminController.Calculate("2026-06");
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetRules_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetSalaryRulesAsync(null)).ReturnsAsync(new List<SalaryRuleDto>());

        var result = await _adminController.GetRules(null);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task CreateRule_Admin_Valid_ReturnsOk()
    {
        var dto = new CreateSalaryRuleDto { RuleName = "Bonus", RuleType = "bonus", Amount = 100, Role = "agent" };
        _mockService.Setup(s => s.CreateSalaryRuleAsync(dto))
            .ReturnsAsync(new SalaryRuleDto { Id = 1, RuleName = "Bonus" });

        var result = await _adminController.CreateRule(dto);

        var value = OkValue<SalaryRuleDto>(result);
        value.Id.Should().Be(1);
    }

    [Fact]
    public async Task CreateRule_NullDto_Returns400()
    {
        var result = await _adminController.CreateRule(null!);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task UpdateRule_Admin_ReturnsOk()
    {
        var dto = new UpdateSalaryRuleDto { Amount = 200 };
        _mockService.Setup(s => s.UpdateSalaryRuleAsync(1, dto)).ReturnsAsync(true);

        var result = await _adminController.UpdateRule(1, dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.Value.Should().BeEquivalentTo(new { success = true });
    }

    [Fact]
    public async Task UpdateRule_NotFound_Returns404()
    {
        var dto = new UpdateSalaryRuleDto { Amount = 200 };
        _mockService.Setup(s => s.UpdateSalaryRuleAsync(999, dto)).ReturnsAsync(false);

        var result = await _adminController.UpdateRule(999, dto);
        AssertNotFound(result);
    }

    [Fact]
    public async Task DeleteRule_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.DeleteSalaryRuleAsync(1)).ReturnsAsync(true);

        var result = await _adminController.DeleteRule(1);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteRule_NotFound_Returns404()
    {
        _mockService.Setup(s => s.DeleteSalaryRuleAsync(999)).ReturnsAsync(false);

        var result = await _adminController.DeleteRule(999);
        AssertNotFound(result);
    }

    [Fact]
    public async Task GetAgentSalary_Admin_ReturnsOk()
    {
        _mockService.Setup(s => s.GetAgentSalaryDetailAsync(2, null))
            .ReturnsAsync(new AgentSalaryDetailDto());

        var result = await _adminController.GetAgentSalary(2, null);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAgentSalary_NotFound_Returns404()
    {
        _mockService.Setup(s => s.GetAgentSalaryDetailAsync(999, null))
            .ThrowsAsync(new KeyNotFoundException());

        var result = await _adminController.GetAgentSalary(999, null);
        AssertNotFound(result);
    }

    [Fact]
    public async Task UpdatePayment_Admin_ReturnsOk()
    {
        var dto = new PaymentStatusDto { Status = "paid" };
        _mockService.Setup(s => s.UpdatePaymentStatusAsync(1, "paid")).ReturnsAsync(true);

        var result = await _adminController.UpdatePayment(1, dto);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UpdatePayment_NotFound_Returns404()
    {
        var dto = new PaymentStatusDto { Status = "paid" };
        _mockService.Setup(s => s.UpdatePaymentStatusAsync(999, "paid")).ReturnsAsync(false);

        var result = await _adminController.UpdatePayment(999, dto);
        AssertNotFound(result);
    }

    [Fact]
    public async Task SalaryEndpoints_Agent_ReturnsForbid()
    {
        var c = _agentController;

        AssertForbid(await c.GetSalaries(null));
        AssertForbid(await c.GetMonthlySummary(null));
        AssertForbid(await c.Calculate(null));
        AssertForbid(await c.GetRules(null));
        AssertForbid(await c.GetAgentSalary(2, null));
    }
}
