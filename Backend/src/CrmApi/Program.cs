using System.Text.Json;
using System.Threading.RateLimiting;
using CrmApi.Services.WebSocket;
using System.Text.Json.Serialization;
using CrmApi.Data;
using CrmApi.Helpers;
using CrmApi.Middleware;
using CrmApi.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Services.Agent;
using CrmApi.Services.Analytics;
using CrmApi.Services.Appointment;
using CrmApi.Services.Attendance;
using CrmApi.Services.Auth;
using CrmApi.Services.Call;
using CrmApi.Services.Ai;
using CrmApi.Services.Chat;
using CrmApi.Services.Lead;
using CrmApi.Services.Message;
using CrmApi.Services.Quality;
using CrmApi.Services.Salary;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppConfig>(builder.Configuration.GetSection("App"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<OllamaSettings>(builder.Configuration.GetSection("Ollama"));
builder.Services.Configure<WeightsConfig>(builder.Configuration.GetSection("Weights"));
builder.Services.Configure<WhisperSettings>(builder.Configuration.GetSection("Whisper"));
builder.Services.Configure<AlertThresholds>(builder.Configuration.GetSection("Alerts"));

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(2);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 2;
    });

    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 10;
    });

    options.OnRejected = async (context, ct) =>
    {
        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue)
            ? (int)retryAfterValue.TotalSeconds
            : 60;
        context.HttpContext.Response.ContentType = "application/json";
        context.HttpContext.Response.Headers["Retry-After"] = retryAfter.ToString();
        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(new { error = "Trop de requetes. Veuillez reessayer dans quelques instants.", retryAfter }),
            ct);
    };
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(Program).Assembly);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
    });

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });

builder.Services.AddAuthorization(options =>
{
    foreach (var perm in Permissions.All)
    {
        options.AddPolicy(perm.Name, policy =>
            policy.Requirements.Add(new PermissionRequirement(perm.Name)));
    }
});

builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CRM AI API", Version = "1.0.0" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICallService, CallService>();
builder.Services.AddScoped<IAgentService, AgentServiceImpl>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ISalaryService, SalaryService>();
builder.Services.AddScoped<IQualityService, QualityService>();
builder.Services.AddScoped<IQualityDashboardService, QualityDashboardService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<ILeadService, LeadService>();

builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddSingleton<WebSocketConnectionManager>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<ITranscriptionService, TranscriptionService>();

builder.Services.AddHttpClient("Ollama");

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddHostedService<DatabaseSeedService>();
builder.Services.AddHostedService<CrmApi.Services.Followup.FollowupBackgroundService>();
builder.Services.AddHostedService<CrmApi.Services.InactivityAlertService>();

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseRateLimiter();
app.UseWebSockets();
app.UseCors("AllowReact");

app.Map("/ws/messages/{userId}", async (Microsoft.AspNetCore.Http.HttpContext context, string userId) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    if (!context.User.Identity?.IsAuthenticated ?? true)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }

    if (!int.TryParse(userId, out var uid))
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    var socket = await context.WebSockets.AcceptWebSocketAsync();
    var manager = context.RequestServices.GetRequiredService<WebSocketConnectionManager>();
    manager.Add(uid, socket);

    var buffer = new byte[1024 * 4];
    var ct = System.Threading.CancellationToken.None;
    try
    {
        while (socket.State == System.Net.WebSockets.WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
            if (result.MessageType == System.Net.WebSockets.WebSocketMessageType.Close)
            {
                await socket.CloseAsync(System.Net.WebSockets.WebSocketCloseStatus.NormalClosure, "Closed", ct);
                break;
            }
        }
    }
    catch
    {
        // ignore exceptions in receive loop
    }
    finally
    {
        manager.Remove(uid);
    }
});

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => new { status = "online", message = "CRM AI Backend is running", version = "1.0.0" });
app.MapGet("/api/health", async (ApplicationDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return canConnect
        ? Results.Ok(new { status = "healthy", database = "connected", timestamp = DateTime.UtcNow })
        : Results.StatusCode(503);
});

app.Run();
