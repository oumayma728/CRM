using System.Net;
using CrmApi.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace CrmApi.Tests.Middleware;

public class ExceptionMiddlewareTests
{
    private readonly Mock<ILogger<ExceptionMiddleware>> _mockLogger;
    private readonly ExceptionMiddleware _sut;

    public ExceptionMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<ExceptionMiddleware>>();
        _sut = new ExceptionMiddleware(_ => throw new Exception("Test error"), _mockLogger.Object);
    }

    [Fact]
    public async Task InvokeAsync_Exception_Returns500()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _sut.InvokeAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task InvokeAsync_Exception_ReturnsJsonContentType()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _sut.InvokeAsync(context);

        context.Response.ContentType.Should().Contain("application/json");
    }

    [Fact]
    public async Task InvokeAsync_Exception_ContainsErrorMessage()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _sut.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        body.Should().Contain("error");
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404()
    {
        var middleware = new ExceptionMiddleware(_ => throw new KeyNotFoundException("Not found"), _mockLogger.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedAccessException_Returns401()
    {
        var middleware = new ExceptionMiddleware(_ => throw new UnauthorizedAccessException("Unauthorized"), _mockLogger.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400()
    {
        var middleware = new ExceptionMiddleware(_ => throw new ArgumentException("Invalid"), _mockLogger.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InvokeAsync_NoException_PassesThrough()
    {
        var middleware = new ExceptionMiddleware(_ => Task.CompletedTask, _mockLogger.Object);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(200);
    }
}
