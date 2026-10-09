namespace Backend.Helpers;

/// <summary>
/// Minimal password rules, used for the FIRST super admin account created at deployment time.
/// (The other password flows of the application are not changed by this class.)
/// </summary>
public static class PasswordPolicy
{
    public const int MinLength = 12;

    // Passwords that appear in this repository (seed scripts, old init page) or are famous: refused.
    private static readonly HashSet<string> Forbidden = new(StringComparer.OrdinalIgnoreCase)
    {
        "role123", "Test1234!", "Admin1234!", "Password123!", "Azerty123456", "Changeme123!",
    };

    /// <returns>null when the password is acceptable, otherwise a message that says what is missing.</returns>
    public static string? Validate(string? password)
    {
        if (string.IsNullOrEmpty(password))
            return "Le mot de passe est vide.";
        if (password.Length < MinLength)
            return $"Le mot de passe doit contenir au moins {MinLength} caractères.";
        if (Forbidden.Contains(password))
            return "Ce mot de passe est trop connu : choisissez-en un autre.";

        var classes = 0;
        if (password.Any(char.IsLower)) classes++;
        if (password.Any(char.IsUpper)) classes++;
        if (password.Any(char.IsDigit)) classes++;
        if (password.Any(c => !char.IsLetterOrDigit(c))) classes++;
        return classes >= 3
            ? null
            : "Le mot de passe doit mélanger au moins 3 types de caractères (minuscules, majuscules, chiffres, symboles).";
    }
}
