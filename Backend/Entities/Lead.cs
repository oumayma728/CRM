using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

[Table("leads")]
public class Lead
{
    [Key]
    public int Id { get; set; }
    public string? Address { get; set; }
    public long? AgentId { get; set; }
    public string? CampaignName { get; set; }
    public string? CompanyName { get; set; }
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? PostalCode { get; set; }
    public string? Status { get; set; }
}