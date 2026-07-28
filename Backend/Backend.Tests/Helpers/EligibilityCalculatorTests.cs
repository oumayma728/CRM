using Backend.Helpers;

namespace Backend.Tests.Helpers;

public class EligibilityCalculatorTests
{
    [Fact]
    public void Calculate_HighIncomeGoodProfile_ReturnsEligible()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 45000,
            chauffage: "gaz",
            toiture: "tuile",
            isolation: "non isole",
            consommation: "haute",
            creditScore: "excellent",
            situationBancaire: "bonne",
            projectType: "PV");

        Assert.True(result.Score >= 70);
        Assert.Equal("Éligible", result.Label);
        Assert.Equal("green", result.Color);
        Assert.True(result.EligibleAides);
    }

    [Fact]
    public void Calculate_LowIncomePoorProfile_ReturnsNotEligible()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 5000,
            chauffage: "electrique",
            toiture: "tuile",
            isolation: "bon",
            consommation: "basse",
            creditScore: "mauvais",
            situationBancaire: "instable",
            projectType: "PAC");

        Assert.True(result.Score < 40);
        Assert.Equal("Non éligible", result.Label);
        Assert.Equal("red", result.Color);
        Assert.False(result.EligibleAides);
    }

    [Fact]
    public void Calculate_MidIncome_ReturnsAVerifier()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 25000,
            chauffage: "electrique",
            toiture: "tuile",
            isolation: "moyen",
            consommation: "moyenne",
            creditScore: "bon",
            situationBancaire: "stable",
            projectType: "PV");

        Assert.True(result.Score is >= 40 and < 70);
        Assert.Equal("À vérifier", result.Label);
        Assert.Equal("orange", result.Color);
    }

    [Fact]
    public void Calculate_NullValues_DoesNotThrow()
    {
        var result = EligibilityCalculator.Calculate(null, null, null, null, null, null, null, null);
        Assert.NotNull(result);
        Assert.Equal("Non éligible", result.Label);
    }
}
