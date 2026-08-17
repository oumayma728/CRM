using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CrmApi.Tests.Integration;

public abstract class ControllerTestBase
{
    protected static ControllerContext CreateControllerContext(int userId = 1, string username = "testadmin", string role = "admin")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, username),
            new("role", role),
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = principal };

        return new ControllerContext { HttpContext = httpContext };
    }

    protected static T CreateController<T>(Func<T> factory, int userId = 1, string role = "admin") where T : ControllerBase
    {
        var controller = factory();
        controller.ControllerContext = CreateControllerContext(userId, role: role);
        return controller;
    }

    protected static Mock<T> CreateMockService<T>() where T : class
    {
        return new Mock<T>(MockBehavior.Strict);
    }

    protected static T OkValue<T>(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return Assert.IsType<T>(ok.Value);
    }

    protected static T CreatedValue<T>(IActionResult result)
    {
        var created = Assert.IsType<CreatedResult>(result);
        return Assert.IsType<T>(created.Value);
    }

    protected static void AssertErrorResponse(IActionResult result, int expectedStatus)
    {
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(expectedStatus, obj.StatusCode);
    }

    protected static void AssertBadRequest(IActionResult result)
    {
        Assert.IsType<BadRequestObjectResult>(result);
    }

    protected static void AssertNotFound(IActionResult result)
    {
        Assert.IsType<NotFoundObjectResult>(result);
    }

    protected static void AssertForbid(IActionResult result)
    {
        Assert.IsType<ForbidResult>(result);
    }
}
