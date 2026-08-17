namespace CrmApi.Helpers;

public class JwtSettings
{
    public string Secret { get; set; } = "crm_ai_secret_key_2026_stable_do_not_change";
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

public class CorsSettings
{
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public class WeightsConfig
{
    public float Accueil { get; set; } = 0.10f;
    public float Energie { get; set; } = 0.15f;
    public float Voix { get; set; } = 0.10f;
    public float Ecoute { get; set; } = 0.15f;
    public float Client { get; set; } = 0.15f;
    public float Operateur { get; set; } = 0.15f;
    public float Efficacite { get; set; } = 0.10f;
    public float Conclusion { get; set; } = 0.10f;
}

public class WhisperSettings
{
    public bool Enabled { get; set; } = true;
    public string PythonPath { get; set; } = "python";
    public string ScriptPath { get; set; } = "ai-scripts/transcribe.py";
    public string Model { get; set; } = "base";
    public string Language { get; set; } = "fr";
    public string Device { get; set; } = "auto";
    public int TimeoutSeconds { get; set; } = 300;
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
    public CorsSettings Cors { get; set; } = new();
    public WeightsConfig Weights { get; set; } = new();
    public AlertThresholds Alerts { get; set; } = new();
}
