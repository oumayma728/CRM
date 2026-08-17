using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CrmApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "agents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    TotalCalls = table.Column<int>(type: "integer", nullable: false),
                    FirstCall = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastCall = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agents", x => x.Id);
                });

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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentName = table.Column<string>(type: "text", nullable: false),
                    AlertType = table.Column<string>(type: "text", nullable: false),
                    ActualValue = table.Column<float>(type: "real", nullable: false),
                    ThresholdValue = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
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
                    Id = table.Column<int>(type: "integer", nullable: false)
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
                    ScoreArgumentation = table.Column<int>(type: "integer", nullable: false),
                    ScoreEcoute = table.Column<int>(type: "integer", nullable: false),
                    ScoreEmpathie = table.Column<int>(type: "integer", nullable: false),
                    ScorePercentage = table.Column<float>(type: "real", nullable: false),
                    ScorePersuasion = table.Column<int>(type: "integer", nullable: false),
                    ScoreRefus = table.Column<int>(type: "integer", nullable: false),
                    ScoreVente = table.Column<int>(type: "integer", nullable: false),
                    ScriptRespected = table.Column<bool>(type: "boolean", nullable: false),
                    Sentiment = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SentimentScore = table.Column<float>(type: "real", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Summary = table.Column<string>(type: "text", nullable: true),
                    Transcription = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_calls", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Commercial",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Matricule = table.Column<string>(type: "text", nullable: true),
                    TauxCommission = table.Column<double>(type: "double precision", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: false),
                    Prenom = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    MotDePasse = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
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
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commercial", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "countries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    PhonePrefix = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_countries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FichierImport",
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
                    table.PrimaryKey("PK_FichierImport", x => x.Id);
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
                    AgentId = table.Column<int>(type: "integer", nullable: true),
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GroupName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Module = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.Id);
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
                name: "SalaryRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RuleType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<float>(type: "real", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Password = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ResetToken = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ResetTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsOnline = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
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
                name: "Conge",
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
                    table.PrimaryKey("PK_Conge", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conge_Commercial_CommercialId",
                        column: x => x.CommercialId,
                        principalTable: "Commercial",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lead_types",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CountryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lead_types", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lead_types_countries_CountryId",
                        column: x => x.CountryId,
                        principalTable: "countries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Contact",
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
                    AgentId1 = table.Column<int>(type: "integer", nullable: true),
                    FichierImportId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contact", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contact_FichierImport_FichierImportId",
                        column: x => x.FichierImportId,
                        principalTable: "FichierImport",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Contact_agents_AgentId1",
                        column: x => x.AgentId1,
                        principalTable: "agents",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PermissionId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolePermissions_permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PermissionId = table.Column<int>(type: "integer", nullable: false),
                    ScopeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ScopeUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_permissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_permissions_permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_profiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    HireDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TypeContrat = table.Column<string>(type: "text", nullable: false),
                    ObjectifMensuel = table.Column<int>(type: "integer", nullable: false),
                    SalaireBase = table.Column<decimal>(type: "numeric", nullable: false),
                    PrimeAssiduite = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalRdv = table.Column<int>(type: "integer", nullable: false),
                    TotalRdvConfirme = table.Column<int>(type: "integer", nullable: false),
                    TotalRdvSigne = table.Column<int>(type: "integer", nullable: false),
                    TotalRdvAnnule = table.Column<int>(type: "integer", nullable: false),
                    TotalPose = table.Column<int>(type: "integer", nullable: false),
                    NoteEvaluationMoyenne = table.Column<decimal>(type: "numeric", nullable: false),
                    DerniereActivite = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_agent_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_saved_data",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_saved_data", x => x.Id);
                    table.ForeignKey(
                        name: "FK_agent_saved_data_users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "attendance",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClockIn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClockOut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_attendance_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true),
                    AutoPoolSizing = table.Column<bool>(type: "boolean", nullable: false),
                    ActivePoolTarget = table.Column<int>(type: "integer", nullable: false),
                    LowContactsThreshold = table.Column<int>(type: "integer", nullable: false),
                    ContactsPerAgentPerHour = table.Column<int>(type: "integer", nullable: false),
                    PoolBufferHours = table.Column<int>(type: "integer", nullable: false),
                    MaxPoolTarget = table.Column<int>(type: "integer", nullable: false),
                    MinPoolTarget = table.Column<int>(type: "integer", nullable: false),
                    LowPoolRatio = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_campaigns_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "crm_appointments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_crm_appointments_users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ManualEvaluations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
                    EvaluatorId = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_ManualEvaluations_users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManualEvaluations_users_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SenderId = table.Column<int>(type: "integer", nullable: false),
                    ReceiverId = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_messages_users_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_messages_users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "salaries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
                    BaseSalary = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InstallationBonus = table.Column<float>(type: "real", nullable: false),
                    Month = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    PaymentStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Penalties = table.Column<float>(type: "real", nullable: false),
                    PoseBonus = table.Column<float>(type: "real", nullable: false),
                    PoseCount = table.Column<int>(type: "integer", nullable: false),
                    QualityBonus = table.Column<float>(type: "real", nullable: false),
                    QualityRate = table.Column<float>(type: "real", nullable: false),
                    RdvBonus = table.Column<float>(type: "real", nullable: false),
                    RdvCount = table.Column<int>(type: "integer", nullable: false),
                    RefusCount = table.Column<int>(type: "integer", nullable: false),
                    TotalSalary = table.Column<float>(type: "real", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_salaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_salaries_users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CountryId = table.Column<int>(type: "integer", nullable: false),
                    LeadTypeId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suppliers_countries_CountryId",
                        column: x => x.CountryId,
                        principalTable: "countries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_suppliers_lead_types_LeadTypeId",
                        column: x => x.LeadTypeId,
                        principalTable: "lead_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_suppliers_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Appel",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: false),
                    AgentId = table.Column<int>(type: "integer", nullable: false),
                    DateHeure = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DureeSecondes = table.Column<int>(type: "integer", nullable: false),
                    Qualification = table.Column<int>(type: "integer", nullable: false),
                    CheminEnregistrement = table.Column<string>(type: "text", nullable: true),
                    Enregistre = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appel_Contact_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contact",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appel_agents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Followups",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: true),
                    AgentId = table.Column<int>(type: "integer", nullable: true),
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
                        name: "FK_Followups_Contact_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contact",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Followups_users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RendezVous",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<long>(type: "bigint", nullable: false),
                    AgentId = table.Column<long>(type: "bigint", nullable: false),
                    AgentId1 = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_RendezVous_Commercial_CommercialId",
                        column: x => x.CommercialId,
                        principalTable: "Commercial",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RendezVous_Contact_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contact",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RendezVous_agents_AgentId1",
                        column: x => x.AgentId1,
                        principalTable: "agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceBreaks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
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
                        name: "FK_AttendanceBreaks_attendance_AttendanceId",
                        column: x => x.AttendanceId,
                        principalTable: "attendance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaign_agents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssignedByUserId = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Quota = table.Column<int>(type: "integer", nullable: true),
                    Weight = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_agents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_campaign_agents_campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_agents_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "source_files",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SupplierId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OriginalName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileSizeLabel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    Format = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Statut = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TotalLines = table.Column<int>(type: "integer", nullable: false),
                    ValidContacts = table.Column<int>(type: "integer", nullable: false),
                    Duplicates = table.Column<int>(type: "integer", nullable: false),
                    EmptyRows = table.Column<int>(type: "integer", nullable: false),
                    InvalidPhones = table.Column<int>(type: "integer", nullable: false),
                    ContactCount = table.Column<int>(type: "integer", nullable: false),
                    ListNumber = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FileHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ValidatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ParentSourceFileId = table.Column<int>(type: "integer", nullable: true),
                    SplitPartNumber = table.Column<int>(type: "integer", nullable: true),
                    SplitTotalParts = table.Column<int>(type: "integer", nullable: true),
                    RecycledFromCampaignListId = table.Column<int>(type: "integer", nullable: true),
                    IsSplitParent = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_files", x => x.Id);
                    table.ForeignKey(
                        name: "FK_source_files_source_files_ParentSourceFileId",
                        column: x => x.ParentSourceFileId,
                        principalTable: "source_files",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_source_files_suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_source_files_users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "campaign_files",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    SourceFileId = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<bool>(type: "boolean", nullable: false),
                    IsRecycled = table.Column<bool>(type: "boolean", nullable: false),
                    IsRemoved = table.Column<bool>(type: "boolean", nullable: false),
                    RemovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RecycledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsInjected = table.Column<bool>(type: "boolean", nullable: false),
                    InjectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InjectedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ContactsTotal = table.Column<int>(type: "integer", nullable: false),
                    ContactsCalled = table.Column<int>(type: "integer", nullable: false),
                    ContactsRemaining = table.Column<int>(type: "integer", nullable: false),
                    IsScheduled = table.Column<bool>(type: "boolean", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ScheduledByUserId = table.Column<int>(type: "integer", nullable: true),
                    ScheduleStatus = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_files", x => x.Id);
                    table.ForeignKey(
                        name: "FK_campaign_files_campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_campaign_files_source_files_SourceFileId",
                        column: x => x.SourceFileId,
                        principalTable: "source_files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agent_profiles_UserId",
                table: "agent_profiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agent_saved_data_AgentId",
                table: "agent_saved_data",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appel_AgentId",
                table: "Appel",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appel_ContactId",
                table: "Appel",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_CallId",
                table: "appointments",
                column: "CallId");

            migrationBuilder.CreateIndex(
                name: "IX_attendance_UserId",
                table: "attendance",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceBreaks_AttendanceId",
                table: "AttendanceBreaks",
                column: "AttendanceId");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_agents_CampaignId",
                table: "campaign_agents",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_agents_UserId",
                table: "campaign_agents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_files_CampaignId",
                table: "campaign_files",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_files_SourceFileId",
                table: "campaign_files",
                column: "SourceFileId");

            migrationBuilder.CreateIndex(
                name: "IX_campaigns_CreatedByUserId",
                table: "campaigns",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Conge_CommercialId",
                table: "Conge",
                column: "CommercialId");

            migrationBuilder.CreateIndex(
                name: "IX_Contact_AgentId1",
                table: "Contact",
                column: "AgentId1");

            migrationBuilder.CreateIndex(
                name: "IX_Contact_FichierImportId",
                table: "Contact",
                column: "FichierImportId");

            migrationBuilder.CreateIndex(
                name: "IX_crm_appointments_AgentId",
                table: "crm_appointments",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Followups_AgentId",
                table: "Followups",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Followups_ContactId",
                table: "Followups",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_lead_types_CountryId",
                table: "lead_types",
                column: "CountryId");

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
                name: "IX_RendezVous_AgentId1",
                table: "RendezVous",
                column: "AgentId1");

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
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_salaries_AgentId",
                table: "salaries",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_ParentSourceFileId",
                table: "source_files",
                column: "ParentSourceFileId");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_SupplierId",
                table: "source_files",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_source_files_UploadedByUserId",
                table: "source_files",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_CountryId",
                table: "suppliers",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_CreatedByUserId",
                table: "suppliers",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_suppliers_LeadTypeId",
                table: "suppliers",
                column: "LeadTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_user_permissions_PermissionId",
                table: "user_permissions",
                column: "PermissionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "Appel");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "AttendanceBreaks");

            migrationBuilder.DropTable(
                name: "campaign_agents");

            migrationBuilder.DropTable(
                name: "campaign_files");

            migrationBuilder.DropTable(
                name: "Conge");

            migrationBuilder.DropTable(
                name: "crm_appointments");

            migrationBuilder.DropTable(
                name: "Followups");

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
                name: "Qualifications");

            migrationBuilder.DropTable(
                name: "RendezVous");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "salaries");

            migrationBuilder.DropTable(
                name: "SalaryRules");

            migrationBuilder.DropTable(
                name: "user_permissions");

            migrationBuilder.DropTable(
                name: "calls");

            migrationBuilder.DropTable(
                name: "attendance");

            migrationBuilder.DropTable(
                name: "campaigns");

            migrationBuilder.DropTable(
                name: "source_files");

            migrationBuilder.DropTable(
                name: "Commercial");

            migrationBuilder.DropTable(
                name: "Contact");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "FichierImport");

            migrationBuilder.DropTable(
                name: "agents");

            migrationBuilder.DropTable(
                name: "lead_types");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "countries");
        }
    }
}
