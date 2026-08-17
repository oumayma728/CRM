namespace CrmApi.Models;

public class WeightsConfig
{
    public double Accueil { get; set; } = 0.15;
    public double Energie { get; set; } = 0.10;
    public double Voix { get; set; } = 0.10;
    public double Ecoute { get; set; } = 0.20;
    public double Client { get; set; } = 0.15;
    public double Ope { get; set; } = 0.10;
    public double Efficacite { get; set; } = 0.10;
    public double Conclusion { get; set; } = 0.10;
}

public class AlertThresholds
{
    public int LowScore { get; set; } = 40;
    public int InactivityMinutes { get; set; } = 30;
    public int LowConversion { get; set; } = 10;
}