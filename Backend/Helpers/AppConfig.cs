namespace Backend.Helpers;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public int ExpirationHours { get; set; } = 24;
    public string Issuer { get; set; } = "crm-api";
    public string Audience { get; set; } = "crm-api-users";
}

public class OllamaSettings
{
    public string BaseUrl { get; set; } = "http://localhost:11434";
    public string Model { get; set; } = "gemma3:4b";
    public int Timeout { get; set; } = 120;
    public int NumPredict { get; set; } = 512;
    public float Temperature { get; set; } = 0.3f;
}

public class WeightsConfig
{
    public float Ecoute { get; set; } = 0.20f;
    public float Persuasion { get; set; } = 0.20f;
    public float Empathie { get; set; } = 0.15f;
    public float Argumentation { get; set; } = 0.20f;
    public float Refus { get; set; } = 0.10f;
    public float Vente { get; set; } = 0.15f;
}

public class AlertThresholds
{
    public int LowScore { get; set; } = 40;
    public int InactivityMinutes { get; set; } = 30;
    public int LowConversion { get; set; } = 10;
}

public class AppConfig
{
    public JwtSettings Jwt { get; set; } = new();
    public OllamaSettings Ollama { get; set; } = new();
    public WeightsConfig Weights { get; set; } = new();
    public AlertThresholds Alerts { get; set; } = new();
}
