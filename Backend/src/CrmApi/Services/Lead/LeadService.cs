using CrmApi.Data;
using CrmApi.DTOs.Lead;
using CrmApi.Models.Entities;
using CsvHelper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using OfficeOpenXml;

namespace CrmApi.Services.Lead;

public class LeadService : ILeadService
{
    private readonly ApplicationDbContext _context;

    public LeadService(ApplicationDbContext context) { _context = context; }

    public async Task<ImportResultDto> ImportLeadsAsync(IFormFile file, string? campaignName, string? companyName)
    {
        var campaign = campaignName ?? "Campagne par defaut";
        var imported = 0;
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        using var stream = file.OpenReadStream();
        if (extension == ".csv")
        {
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;
                var lead = new Models.Entities.Lead
                {
                    CompanyName = companyName ?? "Autre",
                    ContactName = dict.TryGetValue("name", out var name) ? name?.ToString() : dict.TryGetValue("contact_name", out var cn) ? cn?.ToString() : null,
                    Phone = dict.TryGetValue("phone", out var phone) ? phone?.ToString() : null,
                    Email = dict.TryGetValue("email", out var email) ? email?.ToString() : null,
                    PostalCode = dict.TryGetValue("postal_code", out var pc) ? pc?.ToString() : null,
                    CampaignName = campaign,
                    Status = "new"
                };
                _context.Leads.Add(lead);
                imported++;
            }
        }
        else if (extension == ".xlsx" || extension == ".xls")
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var pkg = new ExcelPackage(stream);
            var ws = pkg.Workbook.Worksheets.FirstOrDefault();
            if (ws != null)
            {
                for (int row = 2; row <= ws.Dimension.End.Row; row++)
                {
                    var lead = new Models.Entities.Lead
                    {
                        CompanyName = companyName ?? "Autre",
                        ContactName = ws.Cells[row, 1].Text,
                        Phone = ws.Cells[row, 2].Text,
                        Email = ws.Cells[row, 3].Text,
                        PostalCode = ws.Cells[row, 4].Text,
                        CampaignName = campaign,
                        Status = "new"
                    };
                    _context.Leads.Add(lead);
                    imported++;
                }
            }
        }

        await _context.SaveChangesAsync();
        return new ImportResultDto { Success = true, Filename = file.FileName, Imported = imported, Campaign = campaign };
    }

    public async Task<LeadStatsDto> GetStatsAsync()
    {
        var leads = await _context.Leads.AsNoTracking().ToListAsync();
        return new LeadStatsDto
        {
            Total = leads.Count,
            Campaigns = leads.GroupBy(l => l.CampaignName ?? "default").Select(g => new CampaignCountDto { Campaign = g.Key, Count = g.Count() }).ToList(),
            Statuses = leads.GroupBy(l => l.Status ?? "unknown").Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() }).ToList()
        };
    }

    public async Task<List<LeadDto>> GetLeadsAsync()
    {
        return await _context.Leads.AsNoTracking().Select(l => new LeadDto { Id = l.Id, Name = l.ContactName, Phone = l.Phone, Status = l.Status, PostalCode = l.PostalCode, Agent = l.AgentId.HasValue ? l.AgentId.Value.ToString() : null }).ToListAsync();
    }
}
