using System.Text;
using Backend.Data;
using Backend.Entities;

namespace Backend.Helpers;

/// <summary>Upload / export of contact files (FichierImport), shared by confirmation and technique services.</summary>
public static class FichierImportHelper
{
    /// <summary>Stores the uploaded file under wwwroot/uploads and records it as a FichierImport.</summary>
    public static async Task<FichierImport> SaveUploadAsync(ApplicationDbContext context, IFormFile file, string? campagne, string? importateur)
    {
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, $"{DateTime.Now:yyyyMMdd_HHmmss}_{Path.GetFileName(file.FileName)}");
        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var lineCount = 0;
        using (var reader = new StreamReader(filePath))
            while (await reader.ReadLineAsync() != null) lineCount++;
        var contactCount = Math.Max(0, lineCount - 1);

        var fichierImport = new FichierImport
        {
            NomFichier = campagne ?? file.FileName,
            DateImport = DateTime.UtcNow,
            Importateur = importateur ?? "System",
            NombreTotalLignes = contactCount,
            NombreContactsImportes = contactCount,
            NombreErreurs = 0,
            Actif = true,
            Source = "Upload",
            Statut = StatutImport.TERMINE
        };
        context.FichiersImport.Add(fichierImport);
        await context.SaveChangesAsync();
        return fichierImport;
    }

    /// <summary>CSV export of a file's contacts (file must be loaded with its Contacts).</summary>
    public static (byte[] Bytes, string FileName) ToCsv(FichierImport fichier)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Nom,Prénom,Téléphone,Email,CodePostal,Ville,StatutAgent,ScoreIA");
        foreach (var c in fichier.Contacts)
        {
            sb.AppendLine($"{c.Nom},{c.Prenom},{c.Telephone},{c.Email}," +
                          $"{c.CodePostal},{c.Ville},{c.StatutAgent},{c.ScoreIA}");
        }
        return (Encoding.UTF8.GetBytes(sb.ToString()), $"{fichier.NomFichier}_{DateTime.Now:yyyyMMdd}.csv");
    }
}
