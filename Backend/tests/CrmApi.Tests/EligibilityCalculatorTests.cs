using CrmApi.Helpers;
using FluentAssertions;

namespace CrmApi.Tests;

public class EligibilityCalculatorTests
{
    [Fact]
    public void Calculate_AllMaxValues_ReturnsMaxScore()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 45000,
            chauffage: "gaz",
            toiture: "tuile",
            isolation: "non isole",
            consommation: 350,
            creditScore: 750,
            situationBancaire: "bonne",
            projectType: "PV"
        );

        result.Score.Should().Be(105);
        result.Label.Should().Be("Éligible");
        result.Color.Should().Be("green");
        result.EligibleAides.Should().BeTrue();
        result.AidesEstimees.CEE.Should().Be(4000);
        result.AidesEstimees.CoupDePouce.Should().Be(3000);
        result.AidesEstimees.TvaReduite.Should().Be(0);
        result.AidesEstimees.EcoPtz.Should().Be(0);
    }

    [Fact]
    public void Calculate_AllMinValues_ReturnsMinScore()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 5000,
            chauffage: "bois",
            toiture: "plate",
            isolation: "bon",
            consommation: 50,
            creditScore: 300,
            situationBancaire: "mauvaise",
            projectType: null
        );

        result.Score.Should().Be(30);
        result.Label.Should().Be("Non éligible");
        result.Color.Should().Be("red");
        result.EligibleAides.Should().BeFalse();
        result.AidesEstimees.CEE.Should().Be(0);
    }

    [Fact]
    public void Calculate_NullValues_HandlesGracefully()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: null,
            chauffage: null,
            toiture: null,
            isolation: null,
            consommation: null,
            creditScore: null,
            situationBancaire: null,
            projectType: null
        );

        result.Score.Should().Be(30);
        result.Label.Should().Be("Non éligible");
    }

    [Fact]
    public void Calculate_RevenueBrackets_ProducesCorrectDetail()
    {
        var result = EligibilityCalculator.Calculate(45000, null, null, null, null, null, null, null);

        result.Details.Should().ContainKey("revenus");
        result.Details["revenus"].Weight.Should().Be(0.25f);
    }

    [Fact]
    public void Calculate_LowIncomeGetsTvaReduite()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 25000,
            chauffage: "gaz",
            toiture: "tuile",
            isolation: "non isole",
            consommation: 300,
            creditScore: 700,
            situationBancaire: "bonne",
            projectType: "PV"
        );

        result.AidesEstimees.TvaReduite.Should().Be(1);
        result.AidesEstimees.EcoPtz.Should().Be(0);
    }

    [Fact]
    public void Calculate_AllDetailsPresent()
    {
        var result = EligibilityCalculator.Calculate(30000, "gaz", "tuile", "mauvais", 250, 600, "stable", "PAC");

        result.Details.Should().ContainKeys("revenus", "chauffage", "toiture", "isolation", "consommation", "credit", "bancaire");
        result.Details["revenus"].Weight.Should().Be(0.25f);
        result.Details["chauffage"].Weight.Should().Be(0.20f);
    }

    [Fact]
    public void Calculate_MediumScore_GetsCorrectAides()
    {
        var result = EligibilityCalculator.Calculate(
            revenus: 15000,
            chauffage: "electrique",
            toiture: "tuile",
            isolation: "moyen",
            consommation: 100,
            creditScore: 300,
            situationBancaire: "normale",
            projectType: "PV"
        );

        result.Score.Should().BeInRange(40, 69);
        result.AidesEstimees.CEE.Should().Be(2000);
        result.AidesEstimees.CoupDePouce.Should().Be(1500);
    }
}
