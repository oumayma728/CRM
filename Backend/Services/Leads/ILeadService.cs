using Backend.DTOs.Lead;
using Microsoft.AspNetCore.Http;

namespace Backend.Services.Leads;

public interface ILeadService
{
    Task<ImportResultDto> ImportLeadsAsync(IFormFile file, string? campaignName, string? companyName);
    Task<LeadStatsDto> GetStatsAsync();
    Task<List<LeadDto>> GetLeadsAsync();
}
