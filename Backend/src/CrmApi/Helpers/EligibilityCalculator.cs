using CrmApi.DTOs.Ai;

namespace CrmApi.Helpers;

public static class EligibilityCalculator
{
    public static EligibilityResultDto Calculate(float? revenus, string? chauffage, string? toiture, string? isolation, float? consommation, int? creditScore, string? situationBancaire, string? projectType)
    {
        int score = 0;
        var details = new Dictionary<string, DetailDto>();

        int revenusScore = revenus switch
        {
            >= 40000 => 25,
            >= 30000 => 20,
            >= 20000 => 15,
            >= 10000 => 10,
            _ => 5
        };
        score += revenusScore;
        details["revenus"] = new DetailDto { Value = revenus, Weight = 0.25f, Label = "Revenus" };

        int chauffageScore = chauffage?.ToLower() switch
        {
            "gaz" or "fioul" or "electrique" => 20,
            _ => 10
        };
        score += chauffageScore;
        details["chauffage"] = new DetailDto { Value = chauffage, Weight = 0.20f, Label = "Chauffage" };

        int toitureScore = toiture?.ToLower() switch
        {
            "tuile" or "ardoise" => 15,
            _ => 10
        };
        score += toitureScore;
        details["toiture"] = new DetailDto { Value = toiture, Weight = 0.15f, Label = "Toiture" };

        int isolationScore = isolation?.ToLower() switch
        {
            "non isole" or "mauvais" => 20,
            "moyen" => 10,
            _ => 5
        };
        score += isolationScore;
        details["isolation"] = new DetailDto { Value = isolation, Weight = 0.20f, Label = "Isolation" };

        int consoScore = consommation switch
        {
            >= 300 => 10,
            >= 200 => 5,
            _ => 0
        };
        score += consoScore;
        details["consommation"] = new DetailDto { Value = consommation, Weight = 0.10f, Label = "Consommation" };

        int creditScoreVal = creditScore switch
        {
            >= 700 => 10,
            >= 500 => 5,
            _ => 0
        };
        score += creditScoreVal;
        details["credit"] = new DetailDto { Value = creditScore, Weight = 0.05f, Label = "Score crédit" };

        int bancaireScore = situationBancaire?.ToLower() switch
        {
            "bonne" or "stable" => 5,
            _ => 0
        };
        score += bancaireScore;
        details["bancaire"] = new DetailDto { Value = situationBancaire, Weight = 0.05f, Label = "Situation bancaire" };

        string label = score switch
        {
            >= 70 => "Éligible",
            >= 40 => "À vérifier",
            _ => "Non éligible"
        };

        string color = score switch
        {
            >= 70 => "green",
            >= 40 => "orange",
            _ => "red"
        };

        bool eligibleAides = score >= 40;

        var aides = new AidesDto
        {
            CEE = eligibleAides ? (score >= 70 ? 4000 : 2000) : 0,
            CoupDePouce = eligibleAides ? (score >= 70 ? 3000 : 1500) : 0,
            TvaReduite = eligibleAides && revenus < 30000 ? 1 : 0,
            EcoPtz = eligibleAides && revenus < 25000 ? 1 : 0
        };

        return new EligibilityResultDto
        {
            Score = score,
            Label = label,
            Color = color,
            Recommendation = score >= 70 ? "Client fortement éligible" : score >= 40 ? "Vérifier les conditions" : "Client non éligible",
            Details = details,
            ProjectType = projectType ?? "PV",
            EligibleAides = eligibleAides,
            AidesEstimees = aides
        };
    }
}
