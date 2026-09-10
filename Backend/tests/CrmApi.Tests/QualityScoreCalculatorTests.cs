using CrmApi.Helpers;
using FluentAssertions;

namespace CrmApi.Tests;

public class QualityScoreCalculatorTests
{
    [Fact]
    public void Calculate_AllMaxScores_Returns100()
    {
        var result = QualityScoreCalculator.Calculate(100, 100, 100, 100, 100, 100, 100, 100);

        result.score.Should().Be(100f);
        result.performance.Should().Be("Excellent");
    }

    [Fact]
    public void Calculate_AllZeroScores_ReturnsZero()
    {
        var result = QualityScoreCalculator.Calculate(0, 0, 0, 0, 0, 0, 0, 0);

        result.score.Should().Be(0f);
        result.performance.Should().Be("A améliorer");
    }

    [Fact]
    public void Calculate_ValuesAbove100_ClampedTo100()
    {
        var result = QualityScoreCalculator.Calculate(150, 200, 110, 999, 0, 0, 0, 0);

        result.score.Should().BeGreaterThanOrEqualTo(0);
        result.score.Should().BeLessThanOrEqualTo(100);
    }

    [Fact]
    public void Calculate_NegativeValues_ClampedToZero()
    {
        var result = QualityScoreCalculator.Calculate(-50, -100, -10, 0, 0, 0, 0, 0);

        result.score.Should().BeGreaterThanOrEqualTo(0);
        result.score.Should().BeLessThanOrEqualTo(100);
    }

    [Fact]
    public void Calculate_CustomWeights_ScoreNormalized()
    {
        var weights = new WeightsConfig
        {
            Accueil = 0.25f,
            Energie = 0.25f,
            Voix = 0.25f,
            Ecoute = 0.25f,
            Client = 0.25f,
            Operateur = 0.25f,
            Efficacite = 0.25f,
            Conclusion = 0.25f
        };

        var result = QualityScoreCalculator.Calculate(100, 100, 100, 100, 100, 100, 100, 100, weights);

        result.score.Should().Be(100f);
    }

    [Fact]
    public void Calculate_ZeroWeights_ReturnsZero()
    {
        var weights = new WeightsConfig
        {
            Accueil = 0f,
            Energie = 0f,
            Voix = 0f,
            Ecoute = 0f,
            Client = 0f,
            Operateur = 0f,
            Efficacite = 0f,
            Conclusion = 0f
        };

        var result = QualityScoreCalculator.Calculate(100, 100, 100, 100, 100, 100, 100, 100, weights);

        result.score.Should().Be(0f);
    }

    [Fact]
    public void Calculate_MixedScores_ReturnsWeightedAverage()
    {
        var result = QualityScoreCalculator.Calculate(80, 60, 70, 90, 50, 80, 60, 70);

        result.score.Should().BeGreaterThan(0);
        result.score.Should().BeLessThan(100);
        result.performance.Should().NotBeNullOrEmpty();
    }

    [Theory]
    [InlineData(80, "Excellent")]
    [InlineData(60, "Bon")]
    [InlineData(40, "Moyen")]
    [InlineData(20, "A améliorer")]
    public void Calculate_ThresholdScores_CorrectPerformance(int targetScore, string expectedPerformance)
    {
        var weights = new WeightsConfig();
        var result = QualityScoreCalculator.Calculate(targetScore, targetScore, targetScore, targetScore,
            targetScore, targetScore, targetScore, targetScore, weights);

        result.performance.Should().Be(expectedPerformance);
    }
}
