using Backend.Helpers;

namespace Backend.Tests.Helpers;

public class QualityScoreCalculatorTests
{
    [Fact]
    public void Calculate_AllMaxScores_ReturnsExcellent()
    {
        var (score, performance) = QualityScoreCalculator.Calculate(10, 10, 10, 10, 10, 10);
        Assert.True(score >= 80);
        Assert.Equal("Excellent", performance);
    }

    [Fact]
    public void Calculate_AllMinScores_ReturnsALevel()
    {
        var (score, performance) = QualityScoreCalculator.Calculate(1, 1, 1, 1, 1, 1);
        Assert.True(score < 40);
        Assert.Equal("A ameliorer", performance);
    }

    [Fact]
    public void Calculate_MidScores_ReturnsMoyen()
    {
        var (score, performance) = QualityScoreCalculator.Calculate(5, 5, 5, 5, 5, 5);
        Assert.True(score is >= 40 and < 60);
        Assert.Equal("Moyen", performance);
    }

    [Fact]
    public void Calculate_WithCustomWeights_UsesThem()
    {
        var weights = new WeightsConfig
        {
            Ecoute = 0.3f, Persuasion = 0.2f, Empathie = 0.2f,
            Argumentation = 0.1f, Refus = 0.1f, Vente = 0.1f
        };
        var (score, _) = QualityScoreCalculator.Calculate(10, 5, 5, 5, 5, 5, weights);
        var expected = 10 * 0.3f + 5 * 0.2f + 5 * 0.2f + 5 * 0.1f + 5 * 0.1f + 5 * 0.1f;
        Assert.Equal(Math.Round(expected, 2), score);
    }
}
