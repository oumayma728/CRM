using CrmApi.Data;
using CrmApi.DTOs.Salary;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Salary;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class SalaryServiceTests
{
    private readonly SalaryService _sut;
    private readonly ApplicationDbContext _context;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly Mock<IRepository<User>> _mockUserRepo;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public SalaryServiceTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_salary_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(_options);
        _mockUserRepo = new Mock<IRepository<User>>();
        _mockUow = new Mock<IUnitOfWork>();
        _mockUow.Setup(u => u.Users).Returns(_mockUserRepo.Object);
        _sut = new SalaryService(_context, _mockUow.Object);
    }

    [Fact]
    public async Task GetSalariesAsync_ReturnsAllSalaries()
    {
        var users = new List<User>
        {
            new() { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow },
            new() { Id = 2, Username = "agent2", Name = "Agent 2", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow }
        };
        _context.Users.AddRange(users);

        var salaries = new List<Salary>
        {
            new() { AgentId = 1, Month = "2026-01", BaseSalary = 2000, TotalSalary = 2500, PaymentStatus = "paid" },
            new() { AgentId = 2, Month = "2026-01", BaseSalary = 1800, TotalSalary = 2200, PaymentStatus = "pending" }
        };
        _context.Salaries.AddRange(salaries);
        await _context.SaveChangesAsync();

        foreach (var s in salaries)
        {
            _context.Entry(s).Reference(x => x.Agent).IsLoaded = true;
            s.Agent = users.First(u => u.Id == s.AgentId);
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetSalariesAsync(null);

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetSalariesAsync_FilterByMonth_ReturnsFiltered()
    {
        var user = new User { Id = 1, Username = "agent1", Name = "Agent 1", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow };
        _context.Users.Add(user);

        var salaries = new List<Salary>
        {
            new() { AgentId = 1, Month = "2026-01", BaseSalary = 2000, TotalSalary = 2500, PaymentStatus = "paid" },
            new() { AgentId = 1, Month = "2026-02", BaseSalary = 1800, TotalSalary = 2200, PaymentStatus = "pending" }
        };
        _context.Salaries.AddRange(salaries);
        await _context.SaveChangesAsync();

        foreach (var s in salaries)
        {
            _context.Entry(s).Reference(x => x.Agent).IsLoaded = true;
            s.Agent = user;
        }
        await _context.SaveChangesAsync();

        var result = await _sut.GetSalariesAsync("2026-01");

        result.Should().HaveCount(1);
        result[0].Month.Should().Be("2026-01");
    }

    [Fact]
    public async Task GetSalaryRulesAsync_ReturnsRules()
    {
        _context.SalaryRules.AddRange(
            new SalaryRule { RuleName = "Base Agent", RuleType = "base", Amount = 1800, Role = "agent", IsActive = true },
            new SalaryRule { RuleName = "Base Senior", RuleType = "base", Amount = 2500, Role = "senior", IsActive = true }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetSalaryRulesAsync(null);

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateSalaryRuleAsync_ValidDto_ReturnsRule()
    {
        var dto = new CreateSalaryRuleDto
        {
            RuleName = "Bonus RDV",
            RuleType = "rdv",
            Amount = 50,
            Role = "agent",
            IsActive = true
        };

        var result = await _sut.CreateSalaryRuleAsync(dto);

        result.RuleName.Should().Be("Bonus RDV");
        result.Amount.Should().Be(50);
    }

    [Fact]
    public async Task UpdateSalaryRuleAsync_ExistingRule_ReturnsTrue()
    {
        var rule = new SalaryRule { RuleName = "Old Name", RuleType = "base", Amount = 1000, Role = "agent", IsActive = true };
        _context.SalaryRules.Add(rule);
        await _context.SaveChangesAsync();

        var dto = new UpdateSalaryRuleDto
        {
            RuleName = "New Name",
            Amount = 2000,
            IsActive = false
        };

        var result = await _sut.UpdateSalaryRuleAsync(rule.Id, dto);

        result.Should().BeTrue();
        var updated = await _context.SalaryRules.FindAsync(rule.Id);
        updated!.RuleName.Should().Be("New Name");
        updated.Amount.Should().Be(2000);
        updated.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateSalaryRuleAsync_NonExistentRule_ReturnsFalse()
    {
        var result = await _sut.UpdateSalaryRuleAsync(999, new UpdateSalaryRuleDto { RuleName = "Test" });
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteSalaryRuleAsync_ExistingRule_ReturnsTrue()
    {
        var rule = new SalaryRule { RuleName = "To Delete", RuleType = "bonus", Amount = 100, Role = "agent", IsActive = true };
        _context.SalaryRules.Add(rule);
        await _context.SaveChangesAsync();

        var result = await _sut.DeleteSalaryRuleAsync(rule.Id);

        result.Should().BeTrue();
        var deleted = await _context.SalaryRules.FindAsync(rule.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteSalaryRuleAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.DeleteSalaryRuleAsync(999);
        result.Should().BeFalse();
    }

    [Fact]
    public async Task UpdatePaymentStatusAsync_ValidStatus_Updates()
    {
        var salary = new Salary { AgentId = 1, Month = "2026-01", BaseSalary = 2000, TotalSalary = 2500, PaymentStatus = "pending" };
        _context.Salaries.Add(salary);
        await _context.SaveChangesAsync();

        var result = await _sut.UpdatePaymentStatusAsync(salary.Id, "paid");

        result.Should().BeTrue();
        var updated = await _context.Salaries.FindAsync(salary.Id);
        updated!.PaymentStatus.Should().Be("paid");
    }

    [Fact]
    public async Task GetMonthlySummaryAsync_ReturnsSummary()
    {
        _mockUserRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync((int id) => new User { Id = id, Name = $"Agent {id}", Username = $"agent{id}", Role = UserRole.Agent, Password = "hash", Email = "", CreatedAt = DateTime.UtcNow });

        _context.Salaries.AddRange(
            new Salary { AgentId = 1, Month = "2026-01", BaseSalary = 2000, TotalSalary = 2500, PaymentStatus = "paid" },
            new Salary { AgentId = 2, Month = "2026-01", BaseSalary = 1800, TotalSalary = 2200, PaymentStatus = "pending" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetMonthlySummaryAsync("2026-01");

        result.Month.Should().Be("2026-01");
        result.TotalMass.Should().Be(4700);
    }
}
