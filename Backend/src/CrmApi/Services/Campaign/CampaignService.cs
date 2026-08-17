using CrmApi.Data;
using CrmApi.DTOs.Campaign;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Campaign;

public class CampaignService : ICampaignService
{
    private readonly ApplicationDbContext _context;

    public CampaignService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CampaignDto>> GetCampaignsAsync()
    {
        return await _context.Campaigns
            .AsNoTracking()
            .Select(c => new CampaignDto
            {
                Id = c.Id,
                Name = c.Name,
                CompanyName = c.CompanyName,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<CampaignDto?> GetCampaignByIdAsync(int id)
    {
        var c = await _context.Campaigns.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;

        return new CampaignDto
        {
            Id = c.Id,
            Name = c.Name,
            CompanyName = c.CompanyName,
            CreatedAt = c.CreatedAt
        };
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto dto)
    {
        var campaign = new Models.Entities.Campaign
        {
            Name = dto.Name,
            CompanyName = dto.CompanyName,
            CreatedAt = DateTime.UtcNow
        };

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return new CampaignDto
        {
            Id = campaign.Id,
            Name = campaign.Name,
            CompanyName = campaign.CompanyName,
            CreatedAt = campaign.CreatedAt
        };
    }

    public async Task<bool> UpdateCampaignAsync(int id, UpdateCampaignDto dto)
    {
        var c = await _context.Campaigns.FindAsync(id);
        if (c == null) return false;

        if (dto.Name != null) c.Name = dto.Name;
        if (dto.CompanyName != null) c.CompanyName = dto.CompanyName;

        _context.Campaigns.Update(c);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCampaignAsync(int id)
    {
        var c = await _context.Campaigns.FindAsync(id);
        if (c == null) return false;

        _context.Campaigns.Remove(c);
        await _context.SaveChangesAsync();
        return true;
    }
}
