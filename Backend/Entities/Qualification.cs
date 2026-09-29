using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

[Table("Qualifications")]
public class Qualification
{
    [Key]
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? ExpectedKeywords { get; set; }
    public string Label { get; set; } = string.Empty;
}