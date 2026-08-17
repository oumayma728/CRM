using CrmApi.Controllers;
using CrmApi.DTOs.Salary;
using CrmApi.Services.Salary;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class SalaryControllerTests : ControllerTestBase
{
    private readonly Mock<ISalaryService> _mockService;
    private readonly SalaryController _sut;

    public SalaryControllerTests()
    {
        _mockService = new Mock<ISalaryService>(MockBehavior.Strict);
        _sut = new SalaryController(_mockService.Object);
    }

    [Fact]
    public async Task GetSalaries_Admin_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<SalaryDto> { new() { Month = "2026-01", TotalSalary = 2500 } };
        _mockService.Setup(s => s.GetSalariesAsync(null)).ReturnsAsync(expected);

        var result = await _sut.GetSalaries(null);

        var val = OkValue<List<SalaryDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task GetSalaries_Agent_ReturnsForbid()
    {
        _sut.ControllerContext = CreateControllerContext(role: "agent");

        var result = await _sut.GetSalaries(null);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetMonthlySummary_ReturnsSummary()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new MonthlySummaryDto { Month = "2026-01", TotalMass = 4700 };
        _mockService.Setup(s => s.GetMonthlySummaryAsync("2026-01")).ReturnsAsync(expected);

        var result = await _sut.GetMonthlySummary("2026-01");

        var val = OkValue<MonthlySummaryDto>(result);
        val.TotalMass.Should().Be(4700);
    }

    [Fact]
    public async Task GetRules_ReturnsRules()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new List<SalaryRuleDto> { new() { RuleName = "Base", Amount = 1800 } };
        _mockService.Setup(s => s.GetSalaryRulesAsync(null)).ReturnsAsync(expected);

        var result = await _sut.GetRules(null);

        var val = OkValue<List<SalaryRuleDto>>(result);
        val.Should().ContainSingle();
    }

    [Fact]
    public async Task CreateRule_Valid_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var dto = new CreateSalaryRuleDto { RuleName = "Bonus", RuleType = "bonus", Amount = 100, Role = "agent", IsActive = true };
        var expected = new SalaryRuleDto { RuleName = "Bonus", Amount = 100 };
        _mockService.Setup(s => s.CreateSalaryRuleAsync(dto)).ReturnsAsync(expected);

        var result = await _sut.CreateRule(dto);

        var val = OkValue<SalaryRuleDto>(result);
        val.RuleName.Should().Be("Bonus");
    }

    [Fact]
    public async Task CreateRule_NullBody_ReturnsBadRequest()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");

        var result = await _sut.CreateRule(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public async Task UpdateRule_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var dto = new UpdateSalaryRuleDto { RuleName = "Updated" };
        _mockService.Setup(s => s.UpdateSalaryRuleAsync(1, dto)).ReturnsAsync(true);

        var result = await _sut.UpdateRule(1, dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateRule_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var dto = new UpdateSalaryRuleDto();
        _mockService.Setup(s => s.UpdateSalaryRuleAsync(999, dto)).ReturnsAsync(false);

        var result = await _sut.UpdateRule(999, dto);

        AssertNotFound(result);
    }

    [Fact]
    public async Task DeleteRule_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteSalaryRuleAsync(1)).ReturnsAsync(true);

        var result = await _sut.DeleteRule(1);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteRule_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.DeleteSalaryRuleAsync(999)).ReturnsAsync(false);

        var result = await _sut.DeleteRule(999);

        AssertNotFound(result);
    }

    [Fact]
    public async Task UpdatePayment_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var dto = new PaymentStatusDto { Status = "paid" };
        _mockService.Setup(s => s.UpdatePaymentStatusAsync(1, "paid")).ReturnsAsync(true);

        var result = await _sut.UpdatePayment(1, dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAgentSalary_Existing_ReturnsOk()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        var expected = new AgentSalaryDetailDto { Agent = new AgentInfoDto { Name = "Agent 1" } };
        _mockService.Setup(s => s.GetAgentSalaryDetailAsync(1, null)).ReturnsAsync(expected);

        var result = await _sut.GetAgentSalary(1, null);

        var val = OkValue<AgentSalaryDetailDto>(result);
        val.Agent.Name.Should().Be("Agent 1");
    }

    [Fact]
    public async Task GetAgentSalary_NonExistent_ReturnsNotFound()
    {
        _sut.ControllerContext = CreateControllerContext(role: "admin");
        _mockService.Setup(s => s.GetAgentSalaryDetailAsync(999, null)).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.GetAgentSalary(999, null);

        AssertNotFound(result);
    }
}
