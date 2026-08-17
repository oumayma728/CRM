using CrmApi.Data;
using CrmApi.DTOs.Campaign;
using CrmApi.Services.Campaign;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;

namespace CrmApi.Tests;

public class CampaignServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly CampaignService _sut;

    public CampaignServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"crm_campaign_test_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _sut = new CampaignService(_context);
    }

    [Fact]
    public async Task GetCampaignsAsync_ReturnsAll()
    {
        _context.Campaigns.AddRange(
            new Models.Entities.Campaign { Name = "Campaign A", CompanyName = "Company A" },
            new Models.Entities.Campaign { Name = "Campaign B", CompanyName = "Company B" }
        );
        await _context.SaveChangesAsync();

        var result = await _sut.GetCampaignsAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetCampaignsAsync_Empty_ReturnsEmptyList()
    {
        var result = await _sut.GetCampaignsAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCampaignByIdAsync_Existing_ReturnsDto()
    {
        var campaign = new Models.Entities.Campaign { Name = "Campaign X", CompanyName = "Company X" };
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        var result = await _sut.GetCampaignByIdAsync(campaign.Id);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Campaign X");
        result.CompanyName.Should().Be("Company X");
    }

    [Fact]
    public async Task GetCampaignByIdAsync_NonExistent_ReturnsNull()
    {
        var result = await _sut.GetCampaignByIdAsync(999);

        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateCampaignAsync_ValidDto_CreatesAndReturnsDto()
    {
        var dto = new CreateCampaignDto { Name = "New Campaign", CompanyName = "New Co" };

        var result = await _sut.CreateCampaignAsync(dto);

        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("New Campaign");
        result.CompanyName.Should().Be("New Co");
    }

    [Fact]
    public async Task UpdateCampaignAsync_Existing_UpdatesAndReturnsTrue()
    {
        var campaign = new Models.Entities.Campaign { Name = "Old", CompanyName = "Old Co" };
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        var result = await _sut.UpdateCampaignAsync(campaign.Id, new UpdateCampaignDto { Name = "Updated", CompanyName = "Updated Co" });

        result.Should().BeTrue();
        var updated = await _context.Campaigns.FindAsync(campaign.Id);
        updated!.Name.Should().Be("Updated");
        updated.CompanyName.Should().Be("Updated Co");
    }

    [Fact]
    public async Task UpdateCampaignAsync_PartialUpdate_OnlyChangesProvidedFields()
    {
        var campaign = new Models.Entities.Campaign { Name = "Original", CompanyName = "Original Co" };
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        var result = await _sut.UpdateCampaignAsync(campaign.Id, new UpdateCampaignDto { Name = "New Name Only" });

        result.Should().BeTrue();
        var updated = await _context.Campaigns.FindAsync(campaign.Id);
        updated!.Name.Should().Be("New Name Only");
        updated.CompanyName.Should().Be("Original Co");
    }

    [Fact]
    public async Task UpdateCampaignAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.UpdateCampaignAsync(999, new UpdateCampaignDto { Name = "X" });

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteCampaignAsync_Existing_ReturnsTrueAndRemoves()
    {
        var campaign = new Models.Entities.Campaign { Name = "To Delete" };
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        var result = await _sut.DeleteCampaignAsync(campaign.Id);

        result.Should().BeTrue();
        var deleted = await _context.Campaigns.FindAsync(campaign.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteCampaignAsync_NonExistent_ReturnsFalse()
    {
        var result = await _sut.DeleteCampaignAsync(999);

        result.Should().BeFalse();
    }
}
