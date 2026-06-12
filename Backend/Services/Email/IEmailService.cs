namespace Backend.Services.Email;

public interface IEmailService
{
    /// <summary>
    /// Sends a welcome email to a newly created user with their login credentials.
    /// </summary>
    Task SendWelcomeEmailAsync(string toEmail, string nom, string prenom, string role, string plainPassword);
}
