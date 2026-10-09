using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Backend.Data;
using Backend.Services;
using Backend.Services.Auth;
using Backend.Services.Agent;
using Backend.Services.Admin;
using Backend.Services.Confirmation;
using Backend.Services.Permission;
using Backend.Services.Suppliers;
using Backend.Services.SourceFiles;
using Backend.Services.Country;
using Backend.Services.LeadType;
using Backend.Services.Campaigns;
using Backend.Services.ContactDistribution;
using Backend.Services.AgentProfiles;
using Backend.Services.Files;
using Backend.Services.UserService;
using Backend.Services.Email;
using Backend.Services.Clients;
using Backend.Services.Attendance;
using Backend.Filters;
using Backend.Hubs;
using Backend.Config;
using Backend.Helpers;
using Backend.Services.WebSocket;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
var jwtConfig = new
{
    Secret   = builder.Configuration["Jwt:Secret"],
    Issuer   = builder.Configuration["Jwt:Issuer"],
    Audience = builder.Configuration["Jwt:Audience"]
};

if (string.IsNullOrEmpty(jwtConfig.Secret))
    throw new InvalidOperationException("JWT Secret is not configured!");
if (string.IsNullOrEmpty(jwtConfig.Issuer))
    throw new InvalidOperationException("JWT Issuer is not configured!");
if (string.IsNullOrEmpty(jwtConfig.Audience))
    throw new InvalidOperationException("JWT Audience is not configured!");

// ============================================================================
// SERVICES REGISTRATION
// ============================================================================
builder.Services.AddControllers(options =>
{
    options.Filters.Add<PermissionFilter>();
    // snake_case contract for the modules ported from khaled-dev-v3 (see SnakeCaseJsonAttribute)
    options.InputFormatters.Insert(0, new Backend.Formatters.SnakeCaseJsonInputFormatter());
    options.OutputFormatters.Insert(0, new Backend.Formatters.SnakeCaseJsonOutputFormatter());
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// Database — ConnectionStrings:DefaultConnection, or DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
// (container / Render deployments, from feature/khaled)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
    var dbName = Environment.GetEnvironmentVariable("DB_NAME");
    var dbUser = Environment.GetEnvironmentVariable("DB_USER");
    var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
    if (string.IsNullOrEmpty(dbHost) || string.IsNullOrEmpty(dbName) || string.IsNullOrEmpty(dbUser) || string.IsNullOrEmpty(dbPassword))
        throw new InvalidOperationException("ConnectionStrings:DefaultConnection is missing and DB_HOST, DB_NAME, DB_USER, DB_PASSWORD are not set.");
    var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
    connectionString = $"Host={dbHost};Port={(string.IsNullOrEmpty(dbPort) ? "5432" : dbPort)};Database={dbName};Username={dbUser};Password={dbPassword};";
}
builder.Services.AddDbContext<Backend.Data.ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Rate limiting on authentication endpoints (feature/khaled1): 10 attempts / 2 min per client IP
// (RateLimiting:LoginPermitLimit overrides the limit, e.g. for the E2E suite)
var loginPermitLimit = builder.Configuration.GetValue("RateLimiting:LoginPermitLimit", 10);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = loginPermitLimit, Window = TimeSpan.FromMinutes(2), QueueLimit = 0 }));
    options.OnRejected = async (context, ct) =>
    {
        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue)
            ? (int)retryAfterValue.TotalSeconds
            : 60;
        context.HttpContext.Response.ContentType = "application/json";
        context.HttpContext.Response.Headers["Retry-After"] = retryAfter.ToString();
        await context.HttpContext.Response.WriteAsync(
            System.Text.Json.JsonSerializer.Serialize(new { error = "Trop de requêtes. Veuillez réessayer dans quelques instants.", retryAfter }), ct);
    };
});

// ─── MY EXISTING SERVICES ─────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService,         AuthService>();
builder.Services.AddScoped<Backend.Services.Agent.IAgentService, Backend.Services.Agent.AgentService>();
builder.Services.AddScoped<IAdminService,        AdminService>();
builder.Services.AddScoped<IEmailService,        EmailService>();
builder.Services.AddScoped<IConfirmationService, ConfirmationService>();
builder.Services.AddScoped<IDashboardService,    DashboardService>();
builder.Services.AddScoped<Backend.Services.Permission.IPermissionService, Backend.Services.Permission.PermissionService>();
builder.Services.AddScoped<Backend.Services.Ai.IGroqAiService, Backend.Services.Ai.GroqAiService>();
builder.Services.AddHttpContextAccessor();

// ─── COLLEAGUE'S NEW SERVICES ────────────────────────────────────────────
builder.Services.AddScoped<Backend.Helpers.FileValidationHelper>();
builder.Services.AddScoped<ISupplierService,             SupplierService>();
builder.Services.AddScoped<IFileStorageService,          FileStorageService>();
builder.Services.AddScoped<ISourceFileService,           SourceFileService>();
builder.Services.AddScoped<ICountryService,              CountryService>();
builder.Services.AddScoped<ILeadTypeService,             LeadTypeService>();
builder.Services.AddScoped<ICampaignService,             CampaignService>();
builder.Services.AddScoped<IContactDistributionService,  ContactDistributionService>();
builder.Services.AddScoped<Backend.Services.AgentProfiles.IAgentProfileService, Backend.Services.AgentProfiles.AgentProfileService>();
builder.Services.AddScoped<IClientService,                   ClientService>();
builder.Services.AddScoped<PasswordHasher>();
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddHostedService<SourceFileImportWorker>();

// ─── ATTENDANCE / POINTAGE ───────────────────────────────────────────────
builder.Services.AddScoped<IAttendanceService, AttendanceService>();

// ─── SIGNALR (Chat temps réel) ───────────────────────────────────────────
builder.Services.AddSignalR();

// ─── HTTP CLIENT (pour appels microservice IA Python) ────────────────────
builder.Services.AddHttpClient();

// ─── MODULE ANALYSE D'APPELS IA (khaled-dev-v3) ──────────────────────────
// Appels analysés, RDV CRM, relances, messagerie interne, leads, config IA.
builder.Services.Configure<OllamaSettings>(builder.Configuration.GetSection("Ollama"));
builder.Services.Configure<WeightsConfig>(builder.Configuration.GetSection("Weights"));
builder.Services.Configure<WhisperSettings>(builder.Configuration.GetSection("Whisper"));
builder.Services.Configure<AlertThresholds>(builder.Configuration.GetSection("Alerts"));
builder.Services.AddHttpClient("Ollama");
builder.Services.AddScoped<Backend.Services.Ai.ILlmCompletionService, Backend.Services.Ai.LlmCompletionService>();
builder.Services.AddScoped<Backend.Services.Ai.IAiService, Backend.Services.Ai.AiService>();
builder.Services.AddScoped<Backend.Services.Ai.ITranscriptionService, Backend.Services.Ai.TranscriptionService>();
builder.Services.AddScoped<Backend.Services.Calls.ICallService, Backend.Services.Calls.CallService>();
builder.Services.AddScoped<Backend.Services.Appointments.IAppointmentService, Backend.Services.Appointments.AppointmentService>();
builder.Services.AddScoped<Backend.Services.Messages.IMessageService, Backend.Services.Messages.MessageService>();
builder.Services.AddScoped<Backend.Services.Analytics.IAnalyticsService, Backend.Services.Analytics.AnalyticsService>();
builder.Services.AddScoped<Backend.Services.Quality.IQualityService, Backend.Services.Quality.QualityService>();
builder.Services.AddScoped<Backend.Services.Quality.IQualityDashboardService, Backend.Services.Quality.QualityDashboardService>();
builder.Services.AddScoped<Backend.Services.Leads.ILeadService, Backend.Services.Leads.LeadService>();
builder.Services.AddScoped<Backend.Services.AgentWorkspace.IAgentWorkspaceService, Backend.Services.AgentWorkspace.AgentWorkspaceService>();
builder.Services.AddSingleton<WebSocketConnectionManager>();
builder.Services.AddHostedService<Backend.Services.Followups.FollowupBackgroundService>();
builder.Services.AddHostedService<Backend.Services.Alerts.InactivityAlertService>();

// API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CRM API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// File Upload Configuration
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit         = int.MaxValue;
    options.MultipartBodyLengthLimit = long.MaxValue;
});

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:5174" }
            .Concat(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
            .ToArray();
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("X-Total-Count") // pagination: browsers hide custom headers unless exposed
              .AllowCredentials(); // Required for SignalR WebSocket
    });
});

// ============================================================================
// JWT AUTHENTICATION
// ============================================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig.Secret!)),
            ValidateIssuer   = true,
            ValidIssuer      = jwtConfig.Issuer,
            ValidateAudience = true,
            ValidAudience    = jwtConfig.Audience,
            ValidateLifetime = true,
            ClockSkew        = TimeSpan.Zero
        };

        // ── SignalR WebSocket JWT (le browser ne peut pas envoyer d'en-tête Authorization) ──
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs") || path.StartsWithSegments("/ws")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Dynamic policy provider: any "Permission_..." policy just requires authentication
// (Role-based access is enforced separately by RequirePermissionAttribute at runtime)
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.FallbackPolicy = null;
});
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider,
    Backend.Authorization.PermissionPolicyProvider>();
// SuperAdmin passes every role check, ADMIN passes all except "SuperAdmin"-only routes (salaries...)
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationHandler,
    Backend.Authorization.AdminAccessHandler>();

// ============================================================================
// BUILD & CONFIGURE PIPELINE
// ============================================================================
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseWebSockets();

// ─── WebSocket messagerie interne + alertes d'inactivité (khaled-dev-v3) ────
app.Map("/ws/messages/{userId}", async (HttpContext context, string userId) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    // The route is protected by .RequireAuthorization() below. Here we also make sure nobody opens
    // the socket of ANOTHER user (receiving his messages) just by changing the number in the URL.
    if (!long.TryParse(userId, out var requestedId) || requestedId != UserContextHelper.GetUserId(context.User))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }
    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    var manager = context.RequestServices.GetRequiredService<WebSocketConnectionManager>();
    if (long.TryParse(userId, out var uid)) manager.Add(uid, socket);

    var buffer = new byte[1024 * 4];
    try
    {
        while (socket.State == System.Net.WebSockets.WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            if (result.MessageType == System.Net.WebSockets.WebSocketMessageType.Close)
            {
                await socket.CloseAsync(System.Net.WebSockets.WebSocketCloseStatus.NormalClosure, "Closed", CancellationToken.None);
                break;
            }
        }
    }
    catch { /* client disconnected */ }
    finally { if (long.TryParse(userId, out var id)) manager.Remove(id); }
}).RequireAuthorization();
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── SIGNALR HUB ─────────────────────────────────────────────────────────
app.MapHub<ChatHub>("/hubs/chat");

app.MapGet("/api/health", async (Backend.Data.ApplicationDbContext db) =>
{
    var dbOk = await db.Database.CanConnectAsync();
    return Results.Ok(new { status = dbOk ? "healthy" : "degraded", database = dbOk ? "connected" : "unreachable" });
});

// ─── INITIALISATION DE LA BASE (base vide, premier super admin, copie des comptes) ───────
// Safe on an existing database: it only acts when the database is empty / no super admin exists.
await Backend.Data.DbInitializer.InitializeAsync(app.Services, app.Configuration, app.Logger);

// ─── SEED DONNÉES DE TEST (dev uniquement) ────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<Backend.Data.ApplicationDbContext>();
    await Backend.Data.DbSeeder.SeedAsync(db);
}

app.Run();

// Exposed for WebApplicationFactory-based integration tests (tests/CRM.API.Tests)
public partial class Program { }
