using FluentAssertions;
using CrmApi.Middleware;
using Microsoft.AspNetCore.Http;

namespace CrmApi.Tests.Middleware;

public class SecurityHeadersMiddlewareTests
{
    private readonly SecurityHeadersMiddleware _middleware;

    public SecurityHeadersMiddlewareTests()
    {
        _middleware = new SecurityHeadersMiddleware(async context =>
        {
            await context.Response.WriteAsync("OK");
        });
    }

    [Fact]
    public async Task InvokeAsync_SetsXContentTypeNosniff()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Content-Type-Options");
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
    }

    [Fact]
    public async Task InvokeAsync_SetsXFrameOptionsDeny()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-Frame-Options");
        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY");
    }

    [Fact]
    public async Task InvokeAsync_SetsXSSProtection()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("X-XSS-Protection");
        context.Response.Headers["X-XSS-Protection"].ToString().Should().Be("1; mode=block");
    }

    [Fact]
    public async Task InvokeAsync_SetsReferrerPolicy()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Referrer-Policy");
        context.Response.Headers["Referrer-Policy"].ToString().Should().Be("strict-origin-when-cross-origin");
    }

    [Fact]
    public async Task InvokeAsync_SetsPermissionsPolicy()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Permissions-Policy");
    }

    [Fact]
    public async Task InvokeAsync_SetsContentSecurityPolicy()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Content-Security-Policy");
        context.Response.Headers["Content-Security-Policy"].ToString().Should().Contain("default-src 'self'");
    }

    [Fact]
    public async Task InvokeAsync_NonSwaggerPath_SetsCacheControl()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/data";
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey("Cache-Control");
        context.Response.Headers["Cache-Control"].ToString().Should().Contain("no-store");
    }
}
