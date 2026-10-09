namespace Backend.Entities;

/// <summary>Utilisateur du service qualité — peut évaluer les agents et superviser l'équipe</summary>
public class Qualite : User
{
    public Qualite()
    {
        Service = "QUALITE";
    }
}
