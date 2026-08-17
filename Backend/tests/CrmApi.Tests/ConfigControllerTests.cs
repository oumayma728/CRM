using CrmApi.Controllers;
using CrmApi.Helpers;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class ConfigControllerTests : ControllerTestBase
{
    private readonly Mock<IOptionsMonitor<WeightsConfig>> _mockWeights;
    private readonly Mock<IOptionsMonitor<AlertThresholds>> _mockAlerts;
    private readonly ConfigController _adminController;
    private readonly ConfigController _agentController;

    public ConfigControllerTests()
    {
        _mockWeights = new Mock<IOptionsMonitor<WeightsConfig>>(MockBehavior.Strict);
        _mockAlerts = new Mock<IOptionsMonitor<AlertThresholds>>(MockBehavior.Strict);

        _mockWeights.Setup(x => x.CurrentValue).Returns(new WeightsConfig());
        _mockAlerts.Setup(x => x.CurrentValue).Returns(new AlertThresholds());

        _adminController = new ConfigController(_mockWeights.Object, _mockAlerts.Object);
        _adminController.ControllerContext = CreateControllerContext(role: "admin");

        _agentController = new ConfigController(_mockWeights.Object, _mockAlerts.Object);
        _agentController.ControllerContext = CreateControllerContext(userId: 2, role: "agent");
    }

    [Fact]
    public void GetConfig_ReturnsOk()
    {
        var result = _adminController.GetConfig();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void UpdateWeights_Admin_ReturnsOk()
    {
        var dto = new UpdateConfigDto { Weights = new WeightsConfig() };

        var result = _adminController.UpdateWeights(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void UpdateWeights_Agent_ReturnsForbid()
    {
    }

    [Fact]
    public void UpdateWeights_NullDto_ReturnsBadRequest()
    {
        var result = _adminController.UpdateWeights(null!);

        AssertBadRequest(result);
    }

    [Fact]
    public void SaveSystemConfig_Admin_ReturnsOk()
    {
        var result = _adminController.SaveSystemConfig(new { key = "value" });

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void SaveSystemConfig_Agent_ReturnsForbid()
    {
    }

    [Fact]
    public void SaveSystemConfig_NullDto_ReturnsBadRequest()
    {
        var result = _adminController.SaveSystemConfig(null!);

        AssertBadRequest(result);
    }
}
