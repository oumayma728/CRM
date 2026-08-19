using CrmApi.DTOs.Lead;
using Microsoft.AspNetCore.Http;

namespace CrmApi.Services.Lead;

public interface ILeadService
{
    Task<ImportResultDto> ImportLeadsAsync(IFormFile file, string? campaignName, string? companyName);
    Task<LeadStatsDto> GetStatsAsync();
    Task<List<LeadDto>> GetLeadsAsync();
}
