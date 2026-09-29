namespace Backend.Entities;

/// <summary>Utilisateur du service technique (support / IT)</summary>
public class Technique : User
{
    public Technique()
    {
        Service = "TECHNIQUE";
    }
}
