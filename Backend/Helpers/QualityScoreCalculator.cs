namespace Backend.Helpers;

public static class QualityScoreCalculator
{
    public static (float score, string performance) Calculate(
        int scoreEcoute, int scorePersuasion, int scoreEmpathie,
        int scoreArgumentation, int scoreRefus, int scoreVente,
        WeightsConfig? weights = null)
    {
        weights ??= new WeightsConfig();
        float score = (scoreEcoute * weights.Ecoute) +
                      (scorePersuasion * weights.Persuasion) +
                      (scoreEmpathie * weights.Empathie) +
                      (scoreArgumentation * weights.Argumentation) +
                      (scoreRefus * weights.Refus) +
                      (scoreVente * weights.Vente);
        score = (float)Math.Round(score, 2);
        string performance = score switch
        {
            >= 80 => "Excellent",
            >= 60 => "Bon",
            >= 40 => "Moyen",
            _ => "A améliorer"
        };
        return (score, performance);
    }
}
