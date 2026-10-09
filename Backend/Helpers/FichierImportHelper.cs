using System.Globalization;
using System.Text;
using Backend.Config;
using Backend.Data;
using Backend.Entities;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

namespace Backend.Helpers;

/// <summary>Upload / export of contact files (FichierImport), shared by confirmation and technique services.</summary>
public static class FichierImportHelper
{
    /// <summary>Maximum size of a CSV accepted by this quick import (bigger files use the campaign import screen).</summary>
    public const long MaxFileBytes = 20L * 1024 * 1024;

    private const int InsertBatchSize = 1000;
    private const int MaxErrorsKept = 50;

    /// <summary>
    /// Imports a CSV of contacts for real:
    ///  1. checks the file (type, size),
    ///  2. keeps a copy on disk (audit trail),
    ///  3. reads every line, validates the phone number, skips duplicates (inside the file AND already in the database),
    ///  4. inserts the valid contacts, linked to the FichierImport record,
    ///  5. records the true counts (before: it only COUNTED THE LINES and reported "success" without creating any contact).
    /// </summary>
    /// <exception cref="ArgumentException">file refused (wrong type, too big, no phone column...): the message is safe to show to the user</exception>
    public static async Task<FichierImport> SaveUploadAsync(
        ApplicationDbContext context, IFormFile file, string? campagne, string? importateur, string? uploadRoot = null)
    {
        var originalName = Path.GetFileName(file.FileName ?? "");
        if (!string.Equals(Path.GetExtension(originalName), ".csv", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Format non supporté : seuls les fichiers .csv sont acceptés.");
        if (file.Length == 0)
            throw new ArgumentException("Le fichier est vide.");
        if (file.Length > MaxFileBytes)
            throw new ArgumentException($"Fichier trop volumineux (maximum {MaxFileBytes / (1024 * 1024)} Mo).");

        // 1) keep a copy. The stored name is rebuilt from safe characters only (never trust a client file name).
        var uploadPath = uploadRoot ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadPath);
        var safeName = new string(originalName.Select(c => char.IsLetterOrDigit(c) || c is '.' or '_' or '-' ? c : '_').ToArray());
        var filePath = Path.Combine(uploadPath, $"{DateTime.Now:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}_{safeName}");
        await using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var (rows, delimiter, headerError) = ReadRows(filePath);
        if (headerError != null) throw new ArgumentException(headerError);

        var fichier = new FichierImport
        {
            NomFichier = campagne ?? originalName,
            DateImport = DateTime.UtcNow,
            Importateur = importateur ?? "System",
            Actif = true,
            Source = "Upload",
            Statut = StatutImport.EN_COURS,
        };

        // All-or-nothing on a real database: a crash in the middle must not leave half a file imported.
        await using var tx = context.Database.IsRelational() ? await context.Database.BeginTransactionAsync() : null;

        context.FichiersImport.Add(fichier);
        await context.SaveChangesAsync();                       // gives fichier.Id

        // IMPORTANT for speed: stop tracking the FichierImport while the contacts are inserted. If it stays tracked,
        // EF adds each new contact to fichier.Contacts (a List, searched linearly each time): 50,000 contacts =
        // billions of comparisons (the import took 4 minutes). It is re-attached at the end with Update().
        context.Entry(fichier).State = EntityState.Detached;

        var seenPhones = new HashSet<string>();
        // Phones already in the database, loaded ONCE (a HashSet answers in O(1)). The first version asked the
        // database "which of these 1000 phones exist?" for every batch: on a table without index on Telephone that is
        // a full scan per batch, so the import got slower and slower (228 s for 50,000 lines instead of seconds).
        var knownPhones = (await context.Contacts.AsNoTracking().Select(c => c.Telephone).ToListAsync()).ToHashSet();
        var errors = new List<string>();
        var batch = new List<Contact>(InsertBatchSize);
        int imported = 0, invalid = 0, duplicates = 0;

        async Task FlushAsync()
        {
            if (batch.Count == 0) return;

            // Add() returns false when the phone is already known (database, or inserted by a previous batch)
            var toInsert = batch.Where(c => knownPhones.Add(c.Telephone)).ToList();
            duplicates += batch.Count - toInsert.Count;

            context.Contacts.AddRange(toInsert);
            await context.SaveChangesAsync();
            foreach (var c in toInsert) context.Entry(c).State = EntityState.Detached;   // keep memory flat
            imported += toInsert.Count;
            batch.Clear();
        }

        var line = 1;                                           // line 1 = header
        foreach (var row in rows)
        {
            line++;
            var raw = row.Phone?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(row.Phone) && string.IsNullOrWhiteSpace(row.Nom) && string.IsNullOrWhiteSpace(row.Email))
                continue;                                       // completely empty line

            var phone = NormalizePhone(raw);
            if (phone == null)
            {
                invalid++;
                if (errors.Count < MaxErrorsKept) errors.Add($"Ligne {line} : numéro {(raw.Length == 0 ? "manquant" : $"invalide « {raw} »")}");
                continue;
            }
            if (!seenPhones.Add(phone))
            {
                duplicates++;
                if (errors.Count < MaxErrorsKept) errors.Add($"Ligne {line} : numéro {phone} en double dans le fichier");
                continue;
            }

            batch.Add(new Contact
            {
                Nom = Clean(row.Nom),
                Prenom = Clean(row.Prenom),
                Telephone = phone,
                Email = Clean(row.Email),
                Adresse = Clean(row.Adresse),
                CodePostal = Clean(row.CodePostal),
                Ville = Clean(row.Ville),
                Source = fichier.NomFichier,
                Statut = "A_APPELER",
                DateImport = DateTime.UtcNow,
                FichierImportId = fichier.Id,
            });
            if (batch.Count >= InsertBatchSize) await FlushAsync();

            if (line - 1 > FileProcessingConfig.MAX_ROWS)
                throw new ArgumentException($"Fichier trop long (maximum {FileProcessingConfig.MAX_ROWS} lignes).");
        }
        await FlushAsync();

        fichier.NombreTotalLignes = line - 1;
        fichier.NombreContactsImportes = imported;
        fichier.NombreErreurs = invalid + duplicates;
        fichier.Erreurs = errors;
        fichier.Statut = imported > 0 ? StatutImport.TERMINE : StatutImport.ERREUR;
        context.FichiersImport.Update(fichier);
        await context.SaveChangesAsync();

        if (tx != null) await tx.CommitAsync();
        return fichier;
    }

    /// <summary>JSON answer shared by the upload endpoints (real numbers, not just "success").</summary>
    public static object ToResponse(FichierImport f) => new
    {
        message = f.Statut == StatutImport.TERMINE
            ? $"{f.NombreContactsImportes} contact(s) importé(s) sur {f.NombreTotalLignes} ligne(s)."
            : "Aucun contact valide dans ce fichier.",
        id = f.Id,
        contactsCount = f.NombreContactsImportes,
        totalLines = f.NombreTotalLignes,
        errorsCount = f.NombreErreurs,
        errors = f.Erreurs.Take(10),
    };

    // ─────────────────────────────────────────────────────────────────────────

    private record ImportRow(string? Nom, string? Prenom, string? Phone, string? Email, string? Adresse, string? CodePostal, string? Ville);

    /// <summary>Reads the CSV (comma, semicolon or tab separated) and maps the columns from their header names.</summary>
    private static (List<ImportRow> Rows, string Delimiter, string? Error) ReadRows(string filePath)
    {
        var rows = new List<ImportRow>();

        // French Excel exports use ";" - pick the separator that appears most in the header line.
        var headerLine = File.ReadLines(filePath).FirstOrDefault() ?? "";
        var delimiter = new[] { ",", ";", "\t" }.OrderByDescending(d => headerLine.Split(d).Length).First();

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = delimiter,
            MissingFieldFound = null,
            BadDataFound = null,
            HeaderValidated = null,
            TrimOptions = TrimOptions.Trim,
        };

        using var reader = new StreamReader(filePath, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        using var csv = new CsvReader(reader, config);

        if (!csv.Read()) return (rows, delimiter, "Le fichier est vide.");
        csv.ReadHeader();
        var headers = csv.HeaderRecord ?? Array.Empty<string>();

        var phoneIdx = PhoneColumnDetector.Find(headers);
        if (phoneIdx < 0)
            return (rows, delimiter, "Aucune colonne téléphone trouvée. Ajoutez une colonne nommée « téléphone », « mobile » ou « portable ».");

        int Col(params string[] names) => Array.FindIndex(headers.Select(PhoneColumnDetector.Normalize).ToArray(), h => names.Contains(h));
        var nom = Col("nom", "lastname", "nomdefamille", "name");
        var prenom = Col("prenom", "firstname");
        var email = Col("email", "mail", "courriel");
        var adresse = Col("adresse", "address");
        var cp = Col("codepostal", "cp", "zip", "postalcode");
        var ville = Col("ville", "city", "commune");

        string? Get(int i) => i >= 0 && i < headers.Length ? csv.GetField(i) : null;

        while (csv.Read())
        {
            if (rows.Count >= FileProcessingConfig.MAX_ROWS + 1) break;   // guard checked by the caller
            rows.Add(new ImportRow(Get(nom), Get(prenom), Get(phoneIdx), Get(email), Get(adresse), Get(cp), Get(ville)));
        }
        return (rows, delimiter, null);
    }

    /// <summary>
    /// Keeps digits and a leading "+", removes spaces, dots, dashes and brackets.
    /// Returns null when the result cannot be a phone number (8 to 15 digits, as in the E.164 standard).
    /// </summary>
    public static string? NormalizePhone(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var sb = new StringBuilder();
        foreach (var c in raw.Trim())
        {
            if (char.IsDigit(c)) sb.Append(c);
            else if (c == '+' && sb.Length == 0) sb.Append(c);
            else if (c is ' ' or '.' or '-' or '(' or ')' or ' ') continue;   // formatting characters
            else return null;                                                      // letters etc. => not a number
        }

        var digits = sb.ToString().TrimStart('+');
        return digits.Length is >= 8 and <= 15 ? sb.ToString() : null;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

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
