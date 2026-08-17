namespace CrmApi.DTOs.Supplier;

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSupplierDto
{
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

public class UpdateSupplierDto
{
    public string? Name { get; set; }
    public string? Contact { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}
