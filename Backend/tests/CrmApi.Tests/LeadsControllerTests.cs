using CrmApi.Controllers;
using CrmApi.DTOs.Lead;
using CrmApi.Services.Lead;
using CrmApi.Tests.Integration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;

namespace CrmApi.Tests;

public class LeadsControllerTests : ControllerTestBase
{
    private readonly Mock<ILeadService> _mockService;
    private readonly LeadsController _sut;

    public LeadsControllerTests()
    {
        _mockService = new Mock<ILeadService>(MockBehavior.Strict);
        _sut = new LeadsController(_mockService.Object);
    }

    [Fact]
    public async Task Import_Valid_ReturnsOk()
    {
        var file = new Mock<IFormFile>();
        file.Setup(f => f.Length).Returns(100);
        file.Setup(f => f.FileName).Returns("test.csv");
        var expected = new ImportResultDto { Imported = 5 };
        _mockService.Setup(s => s.ImportLeadsAsync(file.Object, "campaign", "company")).ReturnsAsync(expected);

        var result = await _sut.Import(file.Object, "campaign", "company");

        var val = OkValue<ImportResultDto>(result);
        val.Imported.Should().Be(5);
    }

    [Fact]
    public async Task Import_NullFile_ReturnsBadRequest()
    {
        var result = await _sut.Import(null!, null, null);
        AssertBadRequest(result);
    }

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var expected = new LeadStatsDto { Total = 10 };
        _mockService.Setup(s => s.GetStatsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetStats();

        var val = OkValue<LeadStatsDto>(result);
        val.Total.Should().Be(10);
    }

    [Fact]
    public async Task GetLeads_ReturnsOk()
    {
        var expected = new List<LeadDto> { new() { Id = 1, Name = "Lead" } };
        _mockService.Setup(s => s.GetLeadsAsync()).ReturnsAsync(expected);

        var result = await _sut.GetLeads();

        var val = OkValue<List<LeadDto>>(result);
        val.Should().ContainSingle();
        val[0].Name.Should().Be("Lead");
    }
}
