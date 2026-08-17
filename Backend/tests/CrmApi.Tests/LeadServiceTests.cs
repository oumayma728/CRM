using System.Text;
using CrmApi.Data;
using CrmApi.DTOs.Lead;
using CrmApi.Models.Entities;
using CrmApi.Services.Lead;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CrmApi.Tests;

public class LeadServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly LeadService _sut;

    public LeadServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_lead_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _sut = new LeadService(_context);
    }

    [Fact]
    public async Task ImportLeadsAsync_CsvFile_ImportsLeads()
    {
        var csv = "name,phone,email,postal_code\nJohn Doe,0123456789,john@test.com,75001\nJane Doe,0987654321,jane@test.com,69001";
        var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes(csv)), 0, csv.Length, "leads", "leads.csv");

        var result = await _sut.ImportLeadsAsync(file, "Campagne Test", "Test Corp");

        result.Success.Should().BeTrue();
        result.Imported.Should().Be(2);
        result.Filename.Should().Be("leads.csv");
        result.Campaign.Should().Be("Campagne Test");

        var leads = await _context.Leads.ToListAsync();
        leads.Should().HaveCount(2);
        leads[0].ContactName.Should().Be("John Doe");
        leads[0].Phone.Should().Be("0123456789");
        leads[0].CampaignName.Should().Be("Campagne Test");
        leads[0].CompanyName.Should().Be("Test Corp");
        leads[0].Status.Should().Be("new");
    }

    [Fact]
    public async Task ImportLeadsAsync_CsvWithDefaultCampaign_UsesDefault()
    {
        var csv = "name,phone,email,postal_code\nAlice,0102030405,alice@test.com,75001";
        var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes(csv)), 0, csv.Length, "leads", "leads.csv");

        var result = await _sut.ImportLeadsAsync(file, null, null);

        result.Imported.Should().Be(1);
        var lead = await _context.Leads.FirstAsync();
        lead.CampaignName.Should().Be("Campagne par defaut");
        lead.CompanyName.Should().Be("Autre");
    }

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectStats()
    {
        _context.Leads.AddRange(
            new Lead { ContactName = "A", CampaignName = "Camp1", Status = "new" },
            new Lead { ContactName = "B", CampaignName = "Camp1", Status = "contacted" },
            new Lead { ContactName = "C", CampaignName = "Camp2", Status = "new" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetStatsAsync();

        result.Total.Should().Be(3);
        result.Campaigns.Should().HaveCount(2);
        result.Campaigns.First(c => c.Campaign == "Camp1").Count.Should().Be(2);
        result.Statuses.Should().HaveCount(2);
        result.Statuses.First(s => s.Status == "new").Count.Should().Be(2);
    }

    [Fact]
    public async Task GetStatsAsync_NoData_ReturnsZeros()
    {
        var result = await _sut.GetStatsAsync();

        result.Total.Should().Be(0);
        result.Campaigns.Should().BeEmpty();
        result.Statuses.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLeadsAsync_ReturnsAllLeads()
    {
        _context.Leads.AddRange(
            new Lead { ContactName = "Alpha", Phone = "111", Status = "new", PostalCode = "75001", AgentId = 1 },
            new Lead { ContactName = "Beta", Phone = "222", Status = "contacted", PostalCode = "69001" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetLeadsAsync();

        result.Should().HaveCount(2);
        result[0].Name.Should().Be("Alpha");
        result[0].Agent.Should().Be("1");
        result[1].Name.Should().Be("Beta");
        result[1].Agent.Should().BeNull();
    }
}
