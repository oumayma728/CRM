namespace CrmApi.DTOs.Campaign;

public class CampaignDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCampaignDto
{
    public string Name { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
}

public class UpdateCampaignDto
{
    public string? Name { get; set; }
    public string? CompanyName { get; set; }
}
