using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("LeadFolders")]
public class LeadFolder
{
    [Key]
    public int Id { get; set; }
    public string? Campaign { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Name { get; set; } = string.Empty;
}