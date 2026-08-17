using System;

namespace CrmApi.Helpers;

public static class QualityScoreCalculator
{
    public static (float score, string performance) Calculate(
        int scoreAccueil, int scoreEnergie, int scoreVoix, int scoreEcoute,
        int scoreClient, int scoreOperateur, int scoreEfficacite, int scoreConclusion,
        WeightsConfig? weights = null)
    {
        weights ??= new WeightsConfig();
        float score = Clamp(scoreAccueil) * weights.Accueil +
                      Clamp(scoreEnergie) * weights.Energie +
                      Clamp(scoreVoix) * weights.Voix +
                      Clamp(scoreEcoute) * weights.Ecoute +
                      Clamp(scoreClient) * weights.Client +
                      Clamp(scoreOperateur) * weights.Operateur +
                      Clamp(scoreEfficacite) * weights.Efficacite +
                      Clamp(scoreConclusion) * weights.Conclusion;
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

    private static float Clamp(int value) => Math.Clamp(value, 0, 100);
}
