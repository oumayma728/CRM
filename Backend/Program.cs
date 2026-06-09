using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Backend.Data;
using Backend.Services.Auth;
using Backend.Services.Files;
using Backend.Services.Suppliers;
using Backend.Services.SourceFiles;
using Backend.Services.Country;
using Backend.Services.LeadType;
using Backend.Services.Permissions;
using Backend.Services.ContactDistribution;
using Backend.Services.Campaigns;
using Backend.Services.Agents;
using Backend.Filters;
using Backend.Helpers;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================
var jwtConfig = new
{
    Secret = builder.Configuration["Jwt:Secret"],
    Issuer = builder.Configuration["Jwt:Issuer"],
    Audience = builder.Configuration["Jwt:Audience"]
};

if (string.IsNullOrEmpty(jwtConfig.Secret))
    throw new InvalidOperationException("JWT Secret is not configured in appsettings.json!");
if (string.IsNullOrEmpty(jwtConfig.Issuer))
    throw new InvalidOperationException("JWT Issuer is not configured in appsettings.json!");
if (string.IsNullOrEmpty(jwtConfig.Audience))
    throw new InvalidOperationException("JWT Audience is not configured in appsettings.json!");

// ============================================================================
// SERVICES REGISTRATION
// ============================================================================
builder.Services.AddControllers(options =>
{
    options.Filters.Add<PermissionFilter>();
});
// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Custom Services (Dependency Injection)
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<ISourceFileService, SourceFileService>();
builder.Services.AddScoped<FileValidationHelper>();
builder.Services.AddScoped<IAuthService , AuthService>();
builder.Services.AddScoped<PasswordHasher>();
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IPermissionService, PermissionService>();
//builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<ICountryService, CountryService>();
builder.Services.AddScoped<ILeadTypeService, LeadTypeService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddScoped<IContactDistributionService, ContactDistributionService>();
builder.Services.AddScoped<IAgentService, AgentService>();
builder.Services.AddHostedService<SourceFileImportWorker>();

// API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// File Upload Configuration
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = int.MaxValue;
});

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Add if using cookies/auth headers
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
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig.Issuer,
            ValidAudience = jwtConfig.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.Secret)),
            ClockSkew = TimeSpan.Zero // Strict token expiration
        };

        // Optional: Add custom event handlers for better debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers.Append("Token-Expired", "true");

                }
                return Task.CompletedTask;
            }
        };
    });

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

// ============================================================================
// DATABASE MIGRATIONS (Run at startup)
// ============================================================================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync(); // Use async for better performance
}

// ============================================================================
// DEVELOPMENT MIDDLEWARE
// ============================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ============================================================================
// PRODUCTION MIDDLEWARE (in correct order)
// ============================================================================
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication(); // Must be before Authorization
app.UseAuthorization();
app.MapControllers();

app.Run();
