namespace CrmApi.Helpers;

public static class PasswordHasher
{
    public static string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
        catch
        {
            return password == hashedPassword;
        }
    }
}
