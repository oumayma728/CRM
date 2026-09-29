namespace Backend.Entities;

public class Admin : User
{
    // Propriétés spécifiques à l'admin
    public string? Niveau { get; set; } = "SuperAdmin";
}