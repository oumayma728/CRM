using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiEligibilityLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    ClientData = table.Column<string>(type: "text", nullable: true),
                    Result = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiEligibilityLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AlertHistories",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentName = table.Column<string>(type: "text", nullable: false),
                    AlertType = table.Column<string>(type: "text", nullable: false),
                    ActualValue = table.Column<float>(type: "real", nullable: false),
                    ThresholdValue = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "warning"),
                    Message = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AlertRules",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ThresholdValue = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    NotificationEmail = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "calls",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AgentName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    AgentPoliteness = table.Column<int>(type: "integer", nullable: false),
                    AgentSeconds = table.Column<float>(type: "real", nullable: false),
                    AgentTalkRatio = table.Column<float>(type: "real", nullable: false),
                    AgentText = table.Column<string>(type: "text", nullable: true),
                    AppointmentConfidence = table.Column<int>(type: "integer", nullable: false),
                    AppointmentDate = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AudioFile = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CallDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CallDuration = table.Column<int>(type: "integer", nullable: true),
                    CallType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClientSeconds = table.Column<float>(type: "real", nullable: false),
                    ClientTalkRatio = table.Column<float>(type: "real", nullable: false),
                    ClientText = table.Column<string>(type: "text", nullable: true),
                    CoherenceScore = table.Column<float>(type: "real", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerIntent = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DiarizationMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InactivityDetected = table.Column<bool>(type: "boolean", nullable: false),
                    InactivityDuration = table.Column<float>(type: "real", nullable: false),
                    Keywords = table.Column<string>(type: "text", nullable: true),
                    LabeledTranscript = table.Column<string>(type: "text", nullable: true),
                    LeadId = table.Column<int>(type: "integer", nullable: true),
                    NextSteps = table.Column<string>(type: "text", nullable: true),
                    ObjectionsHandled = table.Column<bool>(type: "boolean", nullable: false),
                    Performance = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Problem = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Qualification = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    QualificationCoherence = table.Column<bool>(type: "boolean", nullable: true),
                    QualificationMatch = table.Column<bool>(type: "boolean", nullable: true),
                    RefusalReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ScoreAccueil = table.Column<int>(type: "integer", nullable: false),
                    ScoreArgumentation = table.Column<int>(type: "integer", nullable: false),
                    ScoreClient = table.Column<int>(type: "integer", nullable: false),
                    ScoreConclusion = table.Column<int>(type: "integer", nullable: false),
                    ScoreEcoute = table.Column<int>(type: "integer", nullable: false),
                    ScoreEfficacite = table.Column<int>(type: "integer", nullable: false),
                    ScoreEmpathie = table.Column<int>(type: "integer", nullable: false),
                    ScoreEnergie = table.Column<int>(type: "integer", nullable: false),
                    ScoreOperateur = table.Column<int>(type: "integer", nullable: false),
                    ScorePercentage = table.Column<float>(type: "real", nullable: false),
                    ScorePersuasion = table.Column<int>(type: "integer", nullable: false),
                    ScoreRefus = table.Column<int>(type: "integer", nullable: false),
                    ScoreVente = table.Column<int>(type: "integer", nullable: false),
                    ScoreVoix = table.Column<int>(type: "integer", nullable: false),
                    ScriptRespected = table.Column<bool>(type: "boolean", nullable: false),
                    Sentiment = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SentimentScore = table.Column<float>(type: "real", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Summary = table.Column<string>(type: "text", nullable: true),
                    Transcription = table.Column<string>(type: "text", nullable: true),
                    TranscriptionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_calls", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SenderId = table.Column<long>(type: "bigint", nullable: false),
                    SenderName = table.Column<string>(type: "text", nullable: false),
                    SenderRole = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Channel = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Client",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "text", nullable: false),
                    nom = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    telephone = table.Column<string>(type: "text", nullable: true),
                    adresse = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Client", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "countries",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    phone_prefix = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_countries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "FichiersImport",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NomFichier = table.Column<string>(type: "text", nullable: false),
                    DateImport = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Importateur = table.Column<string>(type: "text", nullable: false),
                    NombreTotalLignes = table.Column<int>(type: "integer", nullable: false),
                    NombreContactsImportes = table.Column<int>(type: "integer", nullable: false),
                    NombreErreurs = table.Column<int>(type: "integer", nullable: false),
                    Actif = table.Column<bool>(type: "boolean", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    Erreurs = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FichiersImport", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ImportedLeads",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactName = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    CompanyName = table.Column<string>(type: "text", nullable: true),
                    CampaignName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true, defaultValue: "new"),
                    AgentId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportedLeads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LeadFolders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Campaign = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadFolders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Address = table.Column<string>(type: "text", nullable: true),
                    AgentId = table.Column<long>(type: "bigint", nullable: true),
                    CampaignName = table.Column<string>(type: "text", nullable: true),
                    CompanyName = table.Column<string>(type: "text", nullable: true),
                    ContactName = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "logs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    group_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Qualifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    ExpectedKeywords = table.Column<string>(type: "text", nullable: true),
                    Label = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Qualifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "SalaryRules",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RuleType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<float>(type: "real", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "agent"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Utilisateur",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "text", nullable: false),
                    Prenom = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    MotDePasse = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    Actif = table.Column<bool>(type: "boolean", nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false),
                    DerniereConnexion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IdentifiantMachine = table.Column<string>(type: "text", nullable: true),
                    Service = table.Column<string>(type: "text", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "text", nullable: true),
                    PasswordResetTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    Niveau = table.Column<string>(type: "text", nullable: true),
                    TypeContrat = table.Column<string>(type: "text", nullable: true),
                    ObjectifMensuel = table.Column<int>(type: "integer", nullable: true),
                    SalaireBase = table.Column<double>(type: "double precision", nullable: true),
                    PrimeAssiduite = table.Column<double>(type: "double precision", nullable: true),
                    DateEmbauche = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsElite = table.Column<bool>(type: "boolean", nullable: true),
                    Matricule = table.Column<string>(type: "text", nullable: true),
                    TauxCommission = table.Column<double>(type: "double precision", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true),
                    Specialite = table.Column<string>(type: "text", nullable: true),
                    AgendasAccess = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateur", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentIdRef = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CallId = table.Column<int>(type: "integer", nullable: false),
                    ClientName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ClientPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ConfidenceScore = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DetectedDate = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FinalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_appointments_calls_CallId",
                        column: x => x.CallId,
                        principalTable: "calls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_types",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    country_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_types", x => x.id);
                    table.ForeignKey(
                        name: "FK_lead_types_countries_country_id",
                        column: x => x.country_id,
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    permission_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => new { x.role_id, x.permission_id });
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    first_name = table.Column<string>(type: "text", nullable: false),
                    last_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    avatar = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_online = table.Column<bool>(type: "boolean", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    refresh_token = table.Column<string>(type: "text", nullable: true),
                    refresh_token_expiry_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    password_reset_token = table.Column<string>(type: "text", nullable: true),
                    password_reset_token_expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_heartbeat_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    presence_status = table.Column<string>(type: "text", nullable: true),
                    presence_changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    password_reset_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_users_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_users_users_password_reset_by_user_id",
                        column: x => x.password_reset_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "AdvancedAttendances",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClockIn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClockOut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvancedAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdvancedAttendances_Utilisateur_UserId",
                        column: x => x.UserId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Agendas",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agendas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Agendas_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_saved_data",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_saved_data", x => x.Id);
                    table.ForeignKey(
                        name: "FK_agent_saved_data_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Conges",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CommercialId = table.Column<long>(type: "bigint", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conges_Utilisateur_CommercialId",
                        column: x => x.CommercialId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    Prenom = table.Column<string>(type: "text", nullable: true),
                    Telephone = table.Column<string>(type: "text", nullable: false),
                    NumGSM = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Adresse = table.Column<string>(type: "text", nullable: true),
                    CodePostal = table.Column<string>(type: "text", nullable: true),
                    Ville = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: false),
                    DateImport = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false),
                    StatutAgent = table.Column<string>(type: "text", nullable: true),
                    QualificationDetaillee = table.Column<string>(type: "text", nullable: true),
                    Commentaire = table.Column<string>(type: "text", nullable: true),
                    CommentaireConfirmation = table.Column<string>(type: "text", nullable: true),
                    CommentaireCommercial = table.Column<string>(type: "text", nullable: true),
                    CommentaireBanque = table.Column<string>(type: "text", nullable: true),
                    Projet = table.Column<string>(type: "text", nullable: true),
                    TypeRendezVous = table.Column<string>(type: "text", nullable: true),
                    ProprietaireDepuis = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModeChauffage = table.Column<string>(type: "text", nullable: true),
                    ConsommationChauffage = table.Column<string>(type: "text", nullable: true),
                    AgeChaudiere = table.Column<int>(type: "integer", nullable: true),
                    EtudePV = table.Column<bool>(type: "boolean", nullable: true),
                    EquipePV = table.Column<bool>(type: "boolean", nullable: true),
                    EquipePAC = table.Column<bool>(type: "boolean", nullable: true),
                    EtatToiture = table.Column<string>(type: "text", nullable: true),
                    EtatIsolation = table.Column<string>(type: "text", nullable: true),
                    Surface = table.Column<double>(type: "double precision", nullable: true),
                    NombrePersonnes = table.Column<int>(type: "integer", nullable: true),
                    ProfessionMr = table.Column<string>(type: "text", nullable: true),
                    ProfessionMme = table.Column<string>(type: "text", nullable: true),
                    Credits = table.Column<string>(type: "text", nullable: true),
                    Revenus = table.Column<string>(type: "text", nullable: true),
                    Fichage = table.Column<bool>(type: "boolean", nullable: true),
                    DateDernierAppel = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DureeDernierAppel = table.Column<int>(type: "integer", nullable: true),
                    DateRappelPlanifie = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NombreNRP = table.Column<int>(type: "integer", nullable: false),
                    ScoreIA = table.Column<double>(type: "double precision", nullable: true),
                    CreneauOptimalIA = table.Column<string>(type: "text", nullable: true),
                    DateScoreIA = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AgentId = table.Column<long>(type: "bigint", nullable: true),
                    FichierImportId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contacts_FichiersImport_FichierImportId",
                        column: x => x.FichierImportId,
                        principalTable: "FichiersImport",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Contacts_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "crm_appointments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    AppointmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AppointmentTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Chauffage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ClientEmail = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ClientName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ClientPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Consommation = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreditScore = table.Column<int>(type: "integer", nullable: false),
                    FinancingStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Isolation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    ProjectType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityScore = table.Column<int>(type: "integer", nullable: false),
                    Revenus = table.Column<float>(type: "real", nullable: false),
                    SituationBancaire = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Toiture = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_crm_appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_crm_appointments_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ManualEvaluations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    EvaluatorId = table.Column<long>(type: "bigint", nullable: false),
                    CallRef = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GlobalScore = table.Column<float>(type: "real", nullable: false),
                    Decision = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Commentaires = table.Column<string>(type: "text", nullable: true),
                    ScoresJson = table.Column<string>(type: "text", nullable: true),
                    EvaluationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualEvaluations_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManualEvaluations_Utilisateur_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SenderId = table.Column<long>(type: "bigint", nullable: false),
                    ReceiverId = table.Column<long>(type: "bigint", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    IsUrgent = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_messages_Utilisateur_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_messages_Utilisateur_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Performances",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Periode = table.Column<string>(type: "text", nullable: false),
                    NbAppels = table.Column<int>(type: "integer", nullable: false),
                    NbAppelsQualifies = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousBruts = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousConfirmes = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousAnnules = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousReportes = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousHC = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousNonSignes = table.Column<int>(type: "integer", nullable: false),
                    NbRendezVousSignes = table.Column<int>(type: "integer", nullable: false),
                    NbInstallations = table.Column<int>(type: "integer", nullable: false),
                    ObjectifMensuel = table.Column<int>(type: "integer", nullable: false),
                    ObjectifAtteint = table.Column<bool>(type: "boolean", nullable: false),
                    PrimeAssiduite = table.Column<double>(type: "double precision", nullable: false),
                    PrimeMensuelle = table.Column<double>(type: "double precision", nullable: false),
                    PrimeTrimestrielle = table.Column<double>(type: "double precision", nullable: false),
                    TotalPrimes = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Performances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Performances_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pointages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PremierAppel = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DernierAppel = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalSecondesTravaillees = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pointages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pointages_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SalairesAgents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    Month = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    BaseSalary = table.Column<float>(type: "real", nullable: false),
                    RdvCount = table.Column<int>(type: "integer", nullable: false),
                    PoseCount = table.Column<int>(type: "integer", nullable: false),
                    RefusCount = table.Column<int>(type: "integer", nullable: false),
                    QualityRate = table.Column<float>(type: "real", nullable: false),
                    RdvBonus = table.Column<float>(type: "real", nullable: false),
                    PoseBonus = table.Column<float>(type: "real", nullable: false),
                    QualityBonus = table.Column<float>(type: "real", nullable: false),
                    InstallationBonus = table.Column<float>(type: "real", nullable: false),
                    Penalties = table.Column<float>(type: "real", nullable: false),
                    TotalSalary = table.Column<float>(type: "real", nullable: false),
                    PaymentStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalairesAgents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalairesAgents_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    hire_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    type_contrat = table.Column<string>(type: "text", nullable: false),
                    objectif_mensuel = table.Column<int>(type: "integer", nullable: false),
                    salaire_base = table.Column<decimal>(type: "numeric", nullable: false),
                    prime_assiduite = table.Column<decimal>(type: "numeric", nullable: false),
                    total_rdv = table.Column<int>(type: "integer", nullable: false),
                    total_rdv_confirme = table.Column<int>(type: "integer", nullable: false),
                    total_rdv_signe = table.Column<int>(type: "integer", nullable: false),
                    total_rdv_annule = table.Column<int>(type: "integer", nullable: false),
                    total_pose = table.Column<int>(type: "integer", nullable: false),
                    note_evaluation_moyenne = table.Column<decimal>(type: "numeric", nullable: false),
                    derniere_activite = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_agent_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaigns",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    auto_pool_sizing = table.Column<bool>(type: "boolean", nullable: false),
                    active_pool_target = table.Column<int>(type: "integer", nullable: false),
                    low_contacts_threshold = table.Column<int>(type: "integer", nullable: false),
                    contacts_per_agent_per_hour = table.Column<int>(type: "integer", nullable: false),
                    pool_buffer_hours = table.Column<int>(type: "integer", nullable: false),
                    max_pool_target = table.Column<int>(type: "integer", nullable: false),
                    min_pool_target = table.Column<int>(type: "integer", nullable: false),
                    low_pool_ratio = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaigns", x => x.id);
                    table.ForeignKey(
                        name: "FK_campaigns_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country_id = table.Column<int>(type: "integer", nullable: false),
                    lead_type_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.id);
                    table.ForeignKey(
                        name: "FK_suppliers_countries_country_id",
                        column: x => x.country_id,
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_suppliers_lead_types_lead_type_id",
                        column: x => x.lead_type_id,
                        principalTable: "lead_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_suppliers_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    permission_id = table.Column<int>(type: "integer", nullable: false),
                    scope_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    scope_user_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_permissions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceBreaks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AttendanceId = table.Column<long>(type: "bigint", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceBreaks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceBreaks_AdvancedAttendances_AttendanceId",
                        column: x => x.AttendanceId,
                        principalTable: "AdvancedAttendances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Appels",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: false),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    DateHeure = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DureeSecondes = table.Column<int>(type: "integer", nullable: false),
                    Qualification = table.Column<int>(type: "integer", nullable: false),
                    CheminEnregistrement = table.Column<string>(type: "text", nullable: true),
                    Enregistre = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appels_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appels_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Followups",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: true),
                    AgentId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AgentName = table.Column<string>(type: "text", nullable: true),
                    AppointmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RelanceCount = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Followups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Followups_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Followups_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RendezVous",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: false),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    CommercialId = table.Column<long>(type: "bigint", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateRendezVous = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    TypeProjet = table.Column<string>(type: "text", nullable: true),
                    TypeRendezVous = table.Column<string>(type: "text", nullable: true),
                    Commentaire = table.Column<string>(type: "text", nullable: true),
                    CommentaireConfirmation = table.Column<string>(type: "text", nullable: true),
                    CommentaireCommercial = table.Column<string>(type: "text", nullable: true),
                    CommentaireBanque = table.Column<string>(type: "text", nullable: true),
                    MotifRefus = table.Column<string>(type: "text", nullable: true),
                    ARecontacter = table.Column<bool>(type: "boolean", nullable: false),
                    DateReport = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RendezVous", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RendezVous_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RendezVous_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RendezVous_Utilisateur_CommercialId",
                        column: x => x.CommercialId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Pause",
                columns: table => new
                {
                    PointageId = table.Column<long>(type: "bigint", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Debut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Fin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DureeSecondes = table.Column<int>(type: "integer", nullable: false),
                    AlerteEnvoyee = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pause", x => new { x.PointageId, x.Id });
                    table.ForeignKey(
                        name: "FK_Pause_Pointages_PointageId",
                        column: x => x.PointageId,
                        principalTable: "Pointages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaign_agents",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    assigned_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    quota = table.Column<int>(type: "integer", nullable: true),
                    weight = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_agents", x => x.id);
                    table.ForeignKey(
                        name: "FK_campaign_agents_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_agents_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "source_files",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    supplier_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    original_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    file_size_label = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    file_path = table.Column<string>(type: "text", nullable: false),
                    format = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    statut = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    total_lines = table.Column<int>(type: "integer", nullable: false),
                    valid_contacts = table.Column<int>(type: "integer", nullable: false),
                    duplicates = table.Column<int>(type: "integer", nullable: false),
                    empty_rows = table.Column<int>(type: "integer", nullable: false),
                    invalid_phones = table.Column<int>(type: "integer", nullable: false),
                    contact_count = table.Column<int>(type: "integer", nullable: false),
                    list_number = table.Column<int>(type: "integer", nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    file_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    validated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    parsed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    uploaded_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    parent_source_file_id = table.Column<int>(type: "integer", nullable: true),
                    split_part_number = table.Column<int>(type: "integer", nullable: true),
                    split_total_parts = table.Column<int>(type: "integer", nullable: true),
                    recycled_from_campaign_list_id = table.Column<int>(type: "integer", nullable: true),
                    is_split_parent = table.Column<bool>(type: "boolean", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_files", x => x.id);
                    table.ForeignKey(
                        name: "FK_source_files_source_files_parent_source_file_id",
                        column: x => x.parent_source_file_id,
                        principalTable: "source_files",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_source_files_suppliers_supplier_id",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_source_files_users_uploaded_by_user_id",
                        column: x => x.uploaded_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Evaluations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    EvaluateurId = table.Column<long>(type: "bigint", nullable: false),
                    DateEvaluation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NotePitchCommercial = table.Column<int>(type: "integer", nullable: false),
                    NoteTraitementObjections = table.Column<int>(type: "integer", nullable: false),
                    NoteQualiteAppel = table.Column<int>(type: "integer", nullable: false),
                    NoteRespectScript = table.Column<int>(type: "integer", nullable: false),
                    NoteEcoute = table.Column<int>(type: "integer", nullable: false),
                    NoteGlobale = table.Column<double>(type: "double precision", nullable: false),
                    Commentaire = table.Column<string>(type: "text", nullable: true),
                    AppelId = table.Column<long>(type: "bigint", nullable: true),
                    NbRdvBrut = table.Column<int>(type: "integer", nullable: false),
                    NbRdvConfirme = table.Column<int>(type: "integer", nullable: false),
                    NbRdvAnnule = table.Column<int>(type: "integer", nullable: false),
                    NbRdvSigne = table.Column<int>(type: "integer", nullable: false),
                    NbPose = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Evaluations_Appels_AppelId",
                        column: x => x.AppelId,
                        principalTable: "Appels",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Evaluations_Utilisateur_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Utilisateur",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaign_files",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    source_file_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<bool>(type: "boolean", nullable: false),
                    is_recycled = table.Column<bool>(type: "boolean", nullable: false),
                    is_removed = table.Column<bool>(type: "boolean", nullable: false),
                    removed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    recycled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_injected = table.Column<bool>(type: "boolean", nullable: false),
                    injected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    injected_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    contacts_total = table.Column<int>(type: "integer", nullable: false),
                    contacts_called = table.Column<int>(type: "integer", nullable: false),
                    contacts_remaining = table.Column<int>(type: "integer", nullable: false),
                    is_scheduled = table.Column<bool>(type: "boolean", nullable: false),
                    scheduled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    scheduled_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    schedule_status = table.Column<string>(type: "text", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_files", x => x.id);
                    table.ForeignKey(
                        name: "FK_campaign_files_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_files_source_files_source_file_id",
                        column: x => x.source_file_id,
                        principalTable: "source_files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "import_jobs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    status = table.Column<int>(type: "integer", maxLength: 20, nullable: false),
                    source_file_id = table.Column<int>(type: "integer", nullable: true),
                    supplier_id = table.Column<int>(type: "integer", nullable: false),
                    country_id = table.Column<int>(type: "integer", nullable: false),
                    lead_type_id = table.Column<int>(type: "integer", nullable: false),
                    uploaded_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    display_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    stored_file_path = table.Column<string>(type: "text", nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    file_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    format = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    column_mapping_json = table.Column<string>(type: "text", nullable: true),
                    total_rows = table.Column<int>(type: "integer", nullable: false),
                    processed_rows = table.Column<int>(type: "integer", nullable: false),
                    last_heartbeat_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    worker_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    attempts = table.Column<int>(type: "integer", nullable: false),
                    max_attempts = table.Column<int>(type: "integer", nullable: false),
                    raw_file_deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    valid_contacts = table.Column<int>(type: "integer", nullable: false),
                    empty_rows = table.Column<int>(type: "integer", nullable: false),
                    invalid_phones = table.Column<int>(type: "integer", nullable: false),
                    duplicates = table.Column<int>(type: "integer", nullable: false),
                    error_message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_import_jobs", x => x.id);
                    table.ForeignKey(
                        name: "FK_import_jobs_countries_country_id",
                        column: x => x.country_id,
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_import_jobs_lead_types_lead_type_id",
                        column: x => x.lead_type_id,
                        principalTable: "lead_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_import_jobs_source_files_source_file_id",
                        column: x => x.source_file_id,
                        principalTable: "source_files",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_import_jobs_suppliers_supplier_id",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_import_jobs_users_uploaded_by_user_id",
                        column: x => x.uploaded_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "source_file_contacts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    source_file_id = table.Column<int>(type: "integer", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_valid = table.Column<bool>(type: "boolean", nullable: false),
                    original_phone_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    error_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    address = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_file_contacts", x => x.id);
                    table.ForeignKey(
                        name: "fk_source_file_contacts_source_file",
                        column: x => x.source_file_id,
                        principalTable: "source_files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "source_file_invalid_rows",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    import_job_id = table.Column<int>(type: "integer", nullable: false),
                    source_file_id = table.Column<int>(type: "integer", nullable: true),
                    row_number = table.Column<int>(type: "integer", nullable: false),
                    phone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_file_invalid_rows", x => x.id);
                    table.ForeignKey(
                        name: "FK_source_file_invalid_rows_import_jobs_import_job_id",
                        column: x => x.import_job_id,
                        principalTable: "import_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_source_file_invalid_rows_source_files_source_file_id",
                        column: x => x.source_file_id,
                        principalTable: "source_files",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "campaign_file_contacts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_file_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    confirmation_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    confirmed_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    qualified_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    source_file_contact_id = table.Column<int>(type: "integer", nullable: false),
                    assigned_agent_id = table.Column<int>(type: "integer", nullable: true),
                    call_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    qualification_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    attempt_count = table.Column<int>(type: "integer", nullable: false),
                    max_attempts = table.Column<int>(type: "integer", nullable: false),
                    last_call_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_call_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    call_duration_seconds = table.Column<int>(type: "integer", nullable: false),
                    recording_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    appointment_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    appointment_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    agent_comment = table.Column<string>(type: "text", nullable: true),
                    confirmation_comment = table.Column<string>(type: "text", nullable: true),
                    commercial_comment = table.Column<string>(type: "text", nullable: true),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    qualified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    projet = table.Column<string>(type: "text", nullable: true),
                    proprietaire_depuis = table.Column<int>(type: "integer", nullable: true),
                    mode_chauffage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    consommation_chauffage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    age_chaudiere = table.Column<int>(type: "integer", nullable: true),
                    equipe_pv = table.Column<bool>(type: "boolean", nullable: true),
                    equipe_pac = table.Column<bool>(type: "boolean", nullable: true),
                    etat_toiture = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    etat_isolation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    nbre_personnes = table.Column<int>(type: "integer", nullable: true),
                    profession_mr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    profession_mme = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    revenus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    credits = table.Column<bool>(type: "boolean", nullable: true),
                    fichage = table.Column<bool>(type: "boolean", nullable: true),
                    is_assignable = table.Column<bool>(type: "boolean", nullable: false),
                    activated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    random_order = table.Column<double>(type: "double precision", nullable: false),
                    assignment_priority = table.Column<int>(type: "integer", nullable: false),
                    next_action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_file_contacts", x => x.id);
                    table.ForeignKey(
                        name: "FK_campaign_file_contacts_campaign_files_campaign_file_id",
                        column: x => x.campaign_file_id,
                        principalTable: "campaign_files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_file_contacts_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_file_contacts_source_file_contacts_source_file_con~",
                        column: x => x.source_file_contact_id,
                        principalTable: "source_file_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_file_contacts_users_assigned_agent_id",
                        column: x => x.assigned_agent_id,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_campaign_file_contacts_users_confirmed_by_user_id",
                        column: x => x.confirmed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    source_file_contact_id = table.Column<int>(type: "integer", nullable: false),
                    agent_id = table.Column<int>(type: "integer", nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    address = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    gsm = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.id);
                    table.ForeignKey(
                        name: "FK_contacts_source_file_contacts_source_file_contact_id",
                        column: x => x.source_file_contact_id,
                        principalTable: "source_file_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contacts_users_agent_id",
                        column: x => x.agent_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "call_attempts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_file_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_file_contact_id = table.Column<int>(type: "integer", nullable: false),
                    source_file_contact_id = table.Column<int>(type: "integer", nullable: false),
                    agent_id = table.Column<int>(type: "integer", nullable: false),
                    attempt_number = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    qualification_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    provider_call_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    answered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_seconds = table.Column<int>(type: "integer", nullable: true),
                    recording_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_call_attempts", x => x.id);
                    table.ForeignKey(
                        name: "FK_call_attempts_campaign_file_contacts_campaign_file_contact_~",
                        column: x => x.campaign_file_contact_id,
                        principalTable: "campaign_file_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_call_attempts_campaign_files_campaign_file_id",
                        column: x => x.campaign_file_id,
                        principalTable: "campaign_files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_call_attempts_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_call_attempts_source_file_contacts_source_file_contact_id",
                        column: x => x.source_file_contact_id,
                        principalTable: "source_file_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_call_attempts_users_agent_id",
                        column: x => x.agent_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contact_notes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_file_contact_id = table.Column<int>(type: "integer", nullable: false),
                    source_file_contact_id = table.Column<int>(type: "integer", nullable: true),
                    author_user_id = table.Column<int>(type: "integer", nullable: false),
                    note_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_notes", x => x.id);
                    table.ForeignKey(
                        name: "FK_contact_notes_campaign_file_contacts_campaign_file_contact_~",
                        column: x => x.campaign_file_contact_id,
                        principalTable: "campaign_file_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contact_notes_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contact_notes_source_file_contacts_source_file_contact_id",
                        column: x => x.source_file_contact_id,
                        principalTable: "source_file_contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_contact_notes_users_author_user_id",
                        column: x => x.author_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contact_notes_users_deleted_by_user_id",
                        column: x => x.deleted_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_contact_notes_users_updated_by_user_id",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdvancedAttendances_UserId",
                table: "AdvancedAttendances",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_AgentId",
                table: "Agendas",
                column: "AgentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agent_profiles_user_id",
                table: "agent_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agent_saved_data_AgentId",
                table: "agent_saved_data",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appels_AgentId",
                table: "Appels",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appels_ContactId",
                table: "Appels",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_CallId",
                table: "appointments",
                column: "CallId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceBreaks_AttendanceId",
                table: "AttendanceBreaks",
                column: "AttendanceId");

            migrationBuilder.CreateIndex(
                name: "IX_call_attempts_agent_id",
                table: "call_attempts",
                column: "agent_id");

            migrationBuilder.CreateIndex(
                name: "IX_call_attempts_campaign_file_contact_id",
                table: "call_attempts",
                column: "campaign_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_call_attempts_campaign_file_id",
                table: "call_attempts",
                column: "campaign_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_call_attempts_campaign_id",
                table: "call_attempts",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_call_attempts_source_file_contact_id",
                table: "call_attempts",
                column: "source_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_agents_campaign_id",
                table: "campaign_agents",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_agents_user_id",
                table: "campaign_agents",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_file_contacts_assigned_agent_id",
                table: "campaign_file_contacts",
                column: "assigned_agent_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_file_contacts_campaign_file_id",
                table: "campaign_file_contacts",
                column: "campaign_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_file_contacts_campaign_id",
                table: "campaign_file_contacts",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_file_contacts_confirmed_by_user_id",
                table: "campaign_file_contacts",
                column: "confirmed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_file_contacts_source_file_contact_id",
                table: "campaign_file_contacts",
                column: "source_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_files_campaign_id",
                table: "campaign_files",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_files_source_file_id",
                table: "campaign_files",
                column: "source_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_campaigns_created_by_user_id",
                table: "campaigns",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Conges_CommercialId",
                table: "Conges",
                column: "CommercialId");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_author_user_id",
                table: "contact_notes",
                column: "author_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_campaign_file_contact_id",
                table: "contact_notes",
                column: "campaign_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_campaign_id",
                table: "contact_notes",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_deleted_by_user_id",
                table: "contact_notes",
                column: "deleted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_source_file_contact_id",
                table: "contact_notes",
                column: "source_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_contact_notes_updated_by_user_id",
                table: "contact_notes",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_agent_id",
                table: "contacts",
                column: "agent_id");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_source_file_contact_id",
                table: "contacts",
                column: "source_file_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_AgentId",
                table: "Contacts",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_FichierImportId",
                table: "Contacts",
                column: "FichierImportId");

            migrationBuilder.CreateIndex(
                name: "IX_crm_appointments_AgentId",
                table: "crm_appointments",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Evaluations_AgentId",
                table: "Evaluations",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Evaluations_AppelId",
                table: "Evaluations",
                column: "AppelId");

            migrationBuilder.CreateIndex(
                name: "IX_Followups_AgentId",
                table: "Followups",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Followups_ContactId",
                table: "Followups",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_import_jobs_country_id",
                table: "import_jobs",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_import_jobs_lead_type_id",
                table: "import_jobs",
                column: "lead_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_import_jobs_source_file_id",
                table: "import_jobs",
                column: "source_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_import_jobs_supplier_id",
                table: "import_jobs",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_import_jobs_uploaded_by_user_id",
                table: "import_jobs",
                column: "uploaded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_lead_types_country_id",
                table: "lead_types",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_ManualEvaluations_AgentId",
                table: "ManualEvaluations",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_ManualEvaluations_EvaluatorId",
                table: "ManualEvaluations",
                column: "EvaluatorId");

            migrationBuilder.CreateIndex(
                name: "IX_messages_ReceiverId",
                table: "messages",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_messages_SenderId",
                table: "messages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Performances_AgentId",
                table: "Performances",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Pointages_AgentId",
                table: "Pointages",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_RendezVous_AgentId",
                table: "RendezVous",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_RendezVous_CommercialId",
                table: "RendezVous",
                column: "CommercialId");

            migrationBuilder.CreateIndex(
                name: "IX_RendezVous_ContactId",
                table: "RendezVous",
                column: "ContactId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_permission_id",
                table: "role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_SalairesAgents_AgentId",
                table: "SalairesAgents",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_source_file_contacts_source_file_id",
                table: "source_file_contacts",
                column: "source_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_file_invalid_rows_import_job_id",
                table: "source_file_invalid_rows",
                column: "import_job_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_file_invalid_rows_source_file_id",
                table: "source_file_invalid_rows",
                column: "source_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_parent_source_file_id",
                table: "source_files",
                column: "parent_source_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_supplier_id",
                table: "source_files",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_uploaded_by_user_id",
                table: "source_files",
                column: "uploaded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_country_id",
                table: "suppliers",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_created_by_user_id",
                table: "suppliers",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_lead_type_id",
                table: "suppliers",
                column: "lead_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_permissions_permission_id",
                table: "user_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_permissions_user_id",
                table: "user_permissions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_password_reset_by_user_id",
                table: "users",
                column: "password_reset_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_role_id",
                table: "users",
                column: "role_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Agendas");

            migrationBuilder.DropTable(
                name: "agent_profiles");

            migrationBuilder.DropTable(
                name: "agent_saved_data");

            migrationBuilder.DropTable(
                name: "AiEligibilityLogs");

            migrationBuilder.DropTable(
                name: "AlertHistories");

            migrationBuilder.DropTable(
                name: "AlertRules");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "AttendanceBreaks");

            migrationBuilder.DropTable(
                name: "call_attempts");

            migrationBuilder.DropTable(
                name: "campaign_agents");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "Client");

            migrationBuilder.DropTable(
                name: "Conges");

            migrationBuilder.DropTable(
                name: "contact_notes");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "crm_appointments");

            migrationBuilder.DropTable(
                name: "Evaluations");

            migrationBuilder.DropTable(
                name: "Followups");

            migrationBuilder.DropTable(
                name: "ImportedLeads");

            migrationBuilder.DropTable(
                name: "LeadFolders");

            migrationBuilder.DropTable(
                name: "leads");

            migrationBuilder.DropTable(
                name: "logs");

            migrationBuilder.DropTable(
                name: "ManualEvaluations");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "Pause");

            migrationBuilder.DropTable(
                name: "Performances");

            migrationBuilder.DropTable(
                name: "Qualifications");

            migrationBuilder.DropTable(
                name: "RendezVous");

            migrationBuilder.DropTable(
                name: "role_permissions");

            migrationBuilder.DropTable(
                name: "SalairesAgents");

            migrationBuilder.DropTable(
                name: "SalaryRules");

            migrationBuilder.DropTable(
                name: "source_file_invalid_rows");

            migrationBuilder.DropTable(
                name: "user_permissions");

            migrationBuilder.DropTable(
                name: "calls");

            migrationBuilder.DropTable(
                name: "AdvancedAttendances");

            migrationBuilder.DropTable(
                name: "campaign_file_contacts");

            migrationBuilder.DropTable(
                name: "Appels");

            migrationBuilder.DropTable(
                name: "Pointages");

            migrationBuilder.DropTable(
                name: "import_jobs");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "campaign_files");

            migrationBuilder.DropTable(
                name: "source_file_contacts");

            migrationBuilder.DropTable(
                name: "Contacts");

            migrationBuilder.DropTable(
                name: "campaigns");

            migrationBuilder.DropTable(
                name: "source_files");

            migrationBuilder.DropTable(
                name: "FichiersImport");

            migrationBuilder.DropTable(
                name: "Utilisateur");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "lead_types");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "countries");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
