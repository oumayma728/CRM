using System.Globalization;
using System.Text;

namespace Backend.Helpers;

/// <summary>
/// Finds which column of an imported file holds the phone number, from the header names.
///
/// The old code looked for the keyword "n" (short for "N°") with a "contains" test, so ANY header
/// containing the letter n matched: "nom" (= last name) was taken for the phone column and the whole
/// file was rejected as "invalid phone numbers".
///
/// Now: the most specific keywords are tried first (on all columns), the ambiguous ones last, and
/// the very short ones only when the header is exactly that word.
/// </summary>
public static class PhoneColumnDetector
{
    // Tier 1 - clear words, accepted anywhere in the header ("Téléphone portable", "Mobile perso").
    private static readonly string[] Clear = { "telephone", "phone", "portable", "mobile", "gsm" };

    /// <returns>Index of the phone column, or -1 when none looks like one.</returns>
    public static int Find(IReadOnlyList<string> headers)
    {
        var h = headers.Select(Normalize).ToArray();

        // Tier 1: telephone / phone / portable / mobile / gsm, anywhere in the header
        for (var i = 0; i < h.Length; i++)
            if (Clear.Any(k => h[i].Contains(k))) return i;

        // Tier 2: "tel", "tel1", "tel_perso" (starts with tel) or "numero" / "numéro de ..."
        for (var i = 0; i < h.Length; i++)
            if (h[i].StartsWith("tel") || h[i].Contains("numero")) return i;

        // Tier 3: ambiguous short words, only when the header is EXACTLY that word
        for (var i = 0; i < h.Length; i++)
            if (h[i] == "contact" || h[i] == "n") return i;

        return -1;
    }

    /// <summary>Lower case, no accents, only letters and digits ("Téléphone Mobile" → "telephonemobile").</summary>
    internal static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var decomposed = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue; // drop accents
            if (char.IsLetterOrDigit(c)) sb.Append(c);
        }
        return sb.ToString();
    }
}
