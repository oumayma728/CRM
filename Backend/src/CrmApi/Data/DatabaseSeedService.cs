using System.Text.Json;
using CrmApi.Authorization;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CrmApi.Data;

public class DatabaseSeedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseSeedService> _logger;
    private static readonly Random Rng = new();

    public DatabaseSeedService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _logger = serviceProvider.GetRequiredService<ILogger<DatabaseSeedService>>();
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            await context.Database.MigrateAsync(cancellationToken);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P07")
        {
            _logger.LogWarning("Les tables existent déjà dans la base de données. Migration ignorée. ({Message})", ex.MessageText);
            // Tables already exist — ensure migration history is marked so this won't repeat
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync(cancellationToken);
            if (pendingMigrations.Any())
            {
                _logger.LogInformation("Marquage des migrations comme appliquées: {Migrations}", string.Join(", ", pendingMigrations));
                foreach (var migration in pendingMigrations)
                {
                    await context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({0}, {1}) ON CONFLICT DO NOTHING",
                        new object[] { migration, "8.0.0" }, cancellationToken);
                }
            }
        }

        if (await context.Users.AnyAsync(u => u.Role == UserRole.Agent, cancellationToken))
            return;

        var now = DateTime.UtcNow;

        // ── 1. USERS ──
        var admin = new User
        {
            Username = "admin", Password = PasswordHasher.HashPassword("admin"),
            Name = "Administrateur", Role = UserRole.Admin, Email = "admin@crm.local"
        };
        var qualite = new User
        {
            Username = "qualite", Password = PasswordHasher.HashPassword("qualite"),
            Name = "Sophie Moreau", Role = UserRole.Qualite, Email = "s.moreau@crm.local"
        };

        var agentProfiles = new[]
        {
            (user: new User { Username = "sana.b", Password = PasswordHasher.HashPassword("agent"), Name = "Sana Benali", Role = UserRole.Agent, Email = "sana.b@crm.local" }, tier: "high"),
            (user: new User { Username = "ali.m", Password = PasswordHasher.HashPassword("agent"), Name = "Ali Mansouri", Role = UserRole.Agent, Email = "ali.m@crm.local" }, tier: "high"),
            (user: new User { Username = "omar.k", Password = PasswordHasher.HashPassword("agent"), Name = "Omar Khelifi", Role = UserRole.Agent, Email = "omar.k@crm.local" }, tier: "medium"),
            (user: new User { Username = "fatima.z", Password = PasswordHasher.HashPassword("agent"), Name = "Fatima Zahra", Role = UserRole.Agent, Email = "fatima.z@crm.local" }, tier: "medium"),
            (user: new User { Username = "yassine.t", Password = PasswordHasher.HashPassword("agent"), Name = "Yassine Trabelsi", Role = UserRole.Agent, Email = "yassine.t@crm.local" }, tier: "medium"),
            (user: new User { Username = "mariam.z", Password = PasswordHasher.HashPassword("agent"), Name = "Mariam Ziani", Role = UserRole.Agent, Email = "mariam.z@crm.local" }, tier: "high"),
            (user: new User { Username = "kevin.d", Password = PasswordHasher.HashPassword("agent"), Name = "Kevin Dubois", Role = UserRole.Agent, Email = "kevin.d@crm.local" }, tier: "low"),
            (user: new User { Username = "nadia.k", Password = PasswordHasher.HashPassword("agent"), Name = "Nadia Kouassi", Role = UserRole.Agent, Email = "nadia.k@crm.local" }, tier: "low"),
        };

        var allUsers = new[] { admin, qualite }.Concat(agentProfiles.Select(p => p.user)).ToList();
        context.Users.AddRange(allUsers);
        await context.SaveChangesAsync(cancellationToken);

        var agentTiers = allUsers.Where(u => u.Role == UserRole.Agent)
            .Join(agentProfiles, u => u.Username, p => p.user.Username, (u, p) => (user: u, p.tier))
            .ToList();

        // ── 2. AGENTS TABLE ──
        context.Agents.AddRange(agentTiers.Select(t => new Agent
        {
            AgentId = t.user.Id.ToString(), Name = t.user.Name, Email = t.user.Email,
            TotalCalls = 0, CreatedAt = now.AddDays(-120)
        }));
        await context.SaveChangesAsync(cancellationToken);

        // ── 3. CALLS ──
        var calls = new List<Call>();

        var intents = new[] { "Panneaux solaires", "Pompe à chaleur", "Isolation thermique", "Chaudière performance", "Menuiserie énergétique" };

        var transcriptsByIntent = new Dictionary<string, string[]>
        {
            ["Panneaux solaires"] = new[]
            {
                "Bonjour, je vous appelle suite à votre demande d'information sur les panneaux solaires. Je vois que vous êtes propriétaire d'une maison individuelle. Avez-vous déjà une idée du budget que vous souhaitez consacrer à ce projet ? Le client répond qu'il a vu des offres aux alentours de 8000€ mais qu'il trouve cela élevé. Je lui explique qu'il existe des aides comme MaPrimeRénov et la prime CEE qui peuvent réduire le coût jusqu'à 40%. Le client semble intéressé et demande un devis détaillé. Je lui propose un rendez-vous avec notre technicien pour évaluer sa toiture.",
                "Bonjour Monsieur, suite à votre simulation en ligne pour des panneaux photovoltaïques, je vous contacte pour échanger sur votre projet. Vous avez indiqué une consommation annuelle de 12000 kWh. Avec une installation de 6kWc, vous pourriez produire environ 80% de vos besoins. Le client s'interroge sur le retour sur investissement. Je calcule avec lui : une facture d'électricité qui passe de 180€ à 40€ par mois, soit une économie de 1680€ par an. Le client est convaincu et souhaite programmer une visite technique.",
                "Je vous appelle au sujet de votre demande devis pour une installation solaire. Avant toute chose, j'aurais besoin de vérifier quelques informations sur votre habitation. Quelle est la surface de votre toiture et son orientation ? Le client explique qu'il a une toiture de 120m² exposée sud. Parfait, c'est une configuration idéale pour le solaire. Je lui présente les différentes options de financement et il opte pour un crédit à taux zéro. Nous convenons d'un rendez-vous pour la signature. Très bon échange.",
            },
            ["Pompe à chaleur"] = new[]
            {
                "Bonjour, je vous contacte pour votre demande d'information sur les pompes à chaleur. Actuellement vous avez un chauffage au fioul, c'est bien cela ? Le client confirme et précise qu'il consomme environ 2000 litres par an, ce qui lui coûte de plus en plus cher avec la hausse des prix. Je lui explique qu'une PAC air-eau peut réduire sa facture de chauffage de 60 à 70%. Le financement peut être intégré dans un éco-PTZ à taux zéro. Le client demande un comparatif détaillé des modèles disponibles.",
                "Bonjour Madame, Monsieur, suite à votre demande pour un devis pompe à chaleur, je vous propose de faire le point sur vos besoins. Votre logement de 130m² est actuellement chauffé au gaz. Une PAC air-eau de 8kW serait parfaitement adaptée. Le client s'inquiète du bruit extérieur. Je le rassure : les modèles récents ont un niveau sonore de 55dB, soit l'équivalent d'une conversation normale. Il est rassuré et accepte le principe d'une étude thermique gratuite.",
                "Bonjour, ici le service énergie de CRM Solutions. Vous avez sollicité un rendez-vous pour la pose d'une pompe à chaleur. Je souhaitais valider avec vous la date du 15 mars à 14h. Le client confirme mais a des questions sur les aides. Je détaille : MaPrimeRénov jusqu'à 5000€, prime CEE environ 4000€, et TVA à 5.5%. Le total des aides peut couvrir près de la moitié du coût d'installation. Le client est très satisfait de ces informations.",
            },
            ["Isolation thermique"] = new[]
            {
                "Bonjour, je vous contacte concernant votre demande d'isolation des combles. Vous avez mentionné des problèmes de déperdition de chaleur par le toit. Effectivement, 30% des pertes se font par les combles. Le client explique qu'il a des factures de chauffage très élevées malgré un réglage modéré du thermostat. Je lui propose une isolation par soufflage de laine de verre, ce qui peut réduire ses pertes de 25% et lui faire économiser jusqu'à 400€ par an. Le client est très intéressé et demande un devis gratuit.",
                "Bonjour Monsieur, je fais suite à votre demande d'information sur l'isolation des murs par l'extérieur. Votre maison datant des années 70, c'est une excellente initiative pour améliorer votre confort thermique. Le client s'inquiète du coût des travaux. Je lui explique qu'il peut bénéficier de MaPrimeRénov à hauteur de 75€ par m² et d'une prime CEE. Le reste peut être financé par un éco-PTZ. Le client accepte un rendez-vous pour une visite technique.",
                "Bonjour Madame, au sujet de votre projet d'isolation, je vous confirme que l'isolation des combles perdus par soufflage est la solution la plus rapide et la plus économique. En une journée c'est installé et les résultats sont visibles dès la première facture de chauffage. Le client se demande si c'est salissant. Je le rassure : tout est fait par l'extérieur, aucun dérangement à l'intérieur de la maison. Il donne son accord pour un devis.",
            },
            ["Chaudière performance"] = new[]
            {
                "Bonjour Monsieur, je vous appelle car vous avez fait une demande pour le remplacement de votre chaudière. Vous avez actuellement une chaudière gaz de plus de 20 ans, il est effectivement temps de la changer. Le client confirme qu'elle tombe souvent en panne et que les réparations coûtent cher. Je lui présente les modèles à condensation avec un rendement supérieur à 90%, contre 60% pour son ancienne. Il pourra économiser jusqu'à 30% sur sa consommation. Je lui envoie un devis comparatif par email.",
                "Bonjour, suite à votre visite sur notre site, je vous propose un bilan gratuit pour le remplacement de votre ancienne chaudière. Le client explique qu'il hésite entre une chaudière gaz à condensation et une pompe à chaleur. Je lui expose les avantages de chaque solution : la chaudière gaz à condensation est plus économique à l'installation, tandis que la PAC offre un meilleur rendement à long terme. Il choisit finalement la chaudière à condensation pour un budget plus maîtrisé. RDV pris pour l'étude technique.",
                "Bonjour Madame, je vous contacte pour valider ensemble les modalités d'installation de votre nouvelle chaudière. Comme convenu, notre technicien se présentera chez vous le 22 mars. L'installation dure généralement une journée complète. Le client s'interroge sur la garantie. Je le rassure : 5 ans sur le corps de chauffe et 2 ans sur les pièces détachées. Il est satisfait et confirme le rendez-vous.",
            },
            ["Menuiserie énergétique"] = new[]
            {
                "Bonjour, je vous appelle au sujet de votre projet de remplacement de fenêtres. Vous avez actuellement du simple vitrage qui n'isole plus correctement. Le client confirme qu'il ressent des courants d'air et que ses fenêtres sont défectueuses. Je lui propose un devis pour du double vitrage à isolation renforcée avec rupture de pont thermique. Les aides peuvent financer une partie du projet via MaPrimeRénov. Le client demande à recevoir le devis par mail et à être rappelé la semaine prochaine.",
                "Bonjour Monsieur, vous avez sollicité un rendez-vous pour des travaux de menuiserie. Nous pouvons vous proposer des fenêtres PVC double vitrage avec une garantie de 10 ans. Le client demande la différence entre le PVC et l'aluminium. J'explique : le PVC est plus isolant et moins cher, l'aluminium est plus résistant et esthétique mais coûte 30% plus cher. Le client penche pour le PVC. Il demande une simulation de financement avec les aides disponibles.",
            }
        };

        var keywordsByIntent = new Dictionary<string, string[]>
        {
            ["Panneaux solaires"] = new[] { "solaire", "panneau", "photovoltaïque", "toiture", "production", "kWh", "onduleur", "installation", "économie", "financement" },
            ["Pompe à chaleur"] = new[] { "pompe", "chaleur", "PAC", "chauffage", "climatisation", "fioul", "gaz", "thermostat", "rendement", "COP" },
            ["Isolation thermique"] = new[] { "isolation", "combles", "laine", "soufflage", "mur", "thermique", "déperdition", "ITE", "confort", "économies" },
            ["Chaudière performance"] = new[] { "chaudière", "gaz", "condensation", "rendement", "chauffage", "remplacement", "fioul", "entretien", "garantie", "devis" },
            ["Menuiserie énergétique"] = new[] { "fenêtre", "double vitrage", "PVC", "menuiserie", "aluminium", "isolant", "pose", "dormant", "châssis", "vitrage" },
        };

        var firstNames = new[] { "Jean", "Marie", "Pierre", "Sophie", "Thomas", "Julie", "Nicolas", "Emma", "Lucas", "Camille", "Hugo", "Léa", "Alexandre", "Manon", "Romain", "Chloé", "Antoine", "Sarah", "David", "Laura" };
        var lastNames = new[] { "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier" };
        var postalCodes = new[] { "75001", "75008", "75015", "69003", "69006", "13008", "31000", "44000", "33000", "59000", "67000", "06000", "34000", "35000", "38000", "57000", "51100", "83000", "76600", "31400" };

        var refusalReasons = new[] { "Budget insuffisant", "Pas intéressé par le produit", "Déjà équipé chez un concurrent", "Travaux non prioritaires", "Logement en location", "Refus de prise de RDV", "Client difficile à joindre", "Délai trop long" };

        foreach (var (agent, tier) in agentTiers)
        {
            var baseScore = tier switch { "high" => 72, "medium" => 58, "low" => 42, _ => 50 };
            var scoreRange = tier switch { "high" => 20, "medium" => 25, "low" => 25, _ => 25 };
            var baseDuration = tier switch { "high" => 480, "medium" => 350, "low" => 240, _ => 350 };

            for (int dayOffset = 120; dayOffset >= 0; dayOffset--)
            {
                var day = now.AddDays(-dayOffset).Date;
                if (day.DayOfWeek == DayOfWeek.Saturday || day.DayOfWeek == DayOfWeek.Sunday) continue;

                int count = tier switch
                {
                    "high" => Rng.Next(6, 12),
                    "medium" => Rng.Next(4, 9),
                    "low" => Rng.Next(2, 6),
                    _ => Rng.Next(2, 6),
                };

                if (dayOffset < 30) count = (int)(count * 1.2);
                else if (dayOffset > 90) count = (int)(count * 0.6);

                for (int c = 0; c < count; c++)
                {
                    var callDate = day.AddHours(Rng.Next(8, 19)).AddMinutes(Rng.Next(0, 59));
                    var score = (float)Math.Clamp(baseScore + Rng.Next(-scoreRange, scoreRange) + (dayOffset < 30 ? 5 : 0), 20, 100);
                    var positive = score >= 65;
                    var sentiment = positive ? "POSITIVE" : score < 45 ? "NEGATIVE" : "NEUTRAL";

                    var perf = sentiment == "POSITIVE" && score > 82 ? "Converti" : sentiment == "NEGATIVE" ? "Refusé" : "Appel simple";
                    if (score >= 70 && score <= 82) perf = "Qualifié";
                    else if (score >= 50 && score < 70) perf = "Rappel";

                    var intent = intents[Rng.Next(intents.Length)];
                    var intentTranscripts = transcriptsByIntent[intent];
                    var transcript = intentTranscripts[Rng.Next(intentTranscripts.Length)];
                    var keywords = keywordsByIntent[intent];

                    var agentLines = transcript.Split('?', '.', '!')
                        .Where(l => l.Trim().Length > 0)
                        .Select(l => l.Trim() + ".")
                        .ToList();
                    var labeledLines = agentLines.Select((line, i) =>
                        i % 2 == 0 ? $"AG: {line}" : $"CL: {line}");

                    var agentText = string.Join(" ", agentLines.Where((_, i) => i % 2 == 0));
                    var clientText = string.Join(" ", agentLines.Where((_, i) => i % 2 == 1));

                    var callDuration = baseDuration + Rng.Next(-120, 180);
                    var wordCount = transcript.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
                    var agentRatio = Math.Round(0.35 + Rng.NextDouble() * 0.20, 3);
                    var clientRatio = Math.Round(0.25 + Rng.NextDouble() * 0.20, 3);
                    var agentSecs = (int)(callDuration * agentRatio);
                    var clientSecs = (int)(callDuration * clientRatio);

                    var skillBase = (int)Math.Clamp(score / 10 - 1, 3, 9);
                    var refusalReason = sentiment == "NEGATIVE" ? refusalReasons[Rng.Next(refusalReasons.Length)] : null;

                    float qualMatch = (float)(Rng.NextDouble() > 0.2 ? 1 : 0);

                    var appointmentDate = positive && score > 70
                        ? callDate.AddDays(Rng.Next(1, 15)).ToString("yyyy-MM-ddTHH:mm:ss")
                        : null;

                    var nextSteps = positive
                        ? (Rng.NextDouble() > 0.5 ? "Envoi devis sous 24h" : "RDV technique à planifier")
                        : sentiment == "NEUTRAL"
                            ? "Relancer dans 15 jours"
                            : null;

                    calls.Add(new Call
                    {
                        AgentId = agent.Id.ToString(),
                        AgentName = agent.Name,
                        Transcription = transcript,
                        LabeledTranscript = string.Join(" ", labeledLines),
                        AgentText = agentText,
                        ClientText = clientText,
                        Sentiment = sentiment,
                        SentimentScore = (float)Math.Round((double)score / 100, 2),
                        ScorePercentage = score,
                        Performance = perf,
                        Summary = "Appel " + intent + ". " + (positive ? "Échange positif, le client est intéressé." : "Le client est réservé, à recontacter."),
                        KeywordsList = keywords.OrderBy(_ => Rng.Next()).Take(Rng.Next(4, 8)).ToList(),
                        CustomerIntent = intent,
                        CallDuration = callDuration,
                        CallDate = callDate,
                        PostalCode = postalCodes[Rng.Next(postalCodes.Length)],
                        ScoreAccueil = (int)Math.Clamp(skillBase + Rng.Next(-1, 3), 2, 10),
                        ScoreEnergie = (int)Math.Clamp(skillBase + Rng.Next(-1, 2), 2, 10),
                        ScoreVoix = (int)Math.Clamp(skillBase + Rng.Next(-1, 2), 2, 10),
                        ScoreEcoute = (int)Math.Clamp(skillBase + Rng.Next(-1, 3), 2, 10),
                        ScoreClient = (int)Math.Clamp(skillBase + Rng.Next(-2, 2), 2, 10),
                        ScoreOperateur = (int)Math.Clamp(skillBase + Rng.Next(-2, 2), 2, 10),
                        ScoreEfficacite = (int)Math.Clamp(skillBase + Rng.Next(-1, 3), 2, 10),
                        ScoreConclusion = (int)Math.Clamp(skillBase + Rng.Next(-1, 3), 2, 10),
                        ScorePersuasion = (int)Math.Clamp(skillBase + Rng.Next(-2, 2), 2, 10),
                        ScoreEmpathie = (int)Math.Clamp(skillBase + Rng.Next(-1, 2), 2, 10),
                        ScoreArgumentation = (int)Math.Clamp(skillBase + Rng.Next(-2, 3), 2, 10),
                        ScoreRefus = (int)Math.Clamp(skillBase + Rng.Next(-2, 1), 2, 10),
                        ScoreVente = (int)Math.Clamp(skillBase + Rng.Next(-1, 3), 2, 10),
                        AgentTalkRatio = (float)agentRatio,
                        ClientTalkRatio = (float)clientRatio,
                        AgentSeconds = agentSecs,
                        ClientSeconds = clientSecs,
                        InactivityDetected = Rng.NextDouble() < 0.05,
                        InactivityDuration = Rng.Next(15, 120),
                        DiarizationMethod = "whisper",
                        ScriptRespected = score >= 55,
                        ObjectionsHandled = score >= 50,
                        AgentPoliteness = (int)Math.Clamp(skillBase + Rng.Next(-1, 2), 2, 6),
                        RefusalReason = refusalReason,
                        QualificationMatch = qualMatch == 1,
                        CoherenceScore = (float)Math.Round(score / 100f * (0.8 + Rng.NextDouble() * 0.2), 2),
                        Qualification = positive && score > 75 ? "RDV" : sentiment == "NEGATIVE" ? "Refus" : intents[Rng.Next(intents.Length)],
                        QualificationCoherence = Rng.NextDouble() > 0.15,
                        NextSteps = nextSteps,
                        AppointmentDate = appointmentDate,
                        AppointmentConfidence = positive ? Rng.Next(60, 100) : 0,
                        CreatedAt = callDate,
                    });
                }
            }
        }

        context.Calls.AddRange(calls);
        await context.SaveChangesAsync(cancellationToken);

        // ── 4. CRM APPOINTMENTS ──
        var appointments = new List<CrmAppointment>();
        var projectTypes = new[] { "PV", "PAC", "Isolation", "Toiture" };
        var chauffageOpts = new[] { "Gaz", "Électrique", "Fioul", "Bois", "PAC" };
        var toitureOpts = new[] { "Ardoise", "Tuile", "Zinc", "Plate" };
        var isolationOpts = new[] { "Combles", "Mur", "Sous-sol", "ITI", "ITE" };
        var banqueOpts = new[] { "Crédit Agricole", "BNP Paribas", "Société Générale", "Caisse d'Épargne", "Banque Postale", "CIC", "Crédit Mutuel", "LCL" };
        var clientNames = new[] { "Jean Martin", "Sophie Bernard", "Pierre Dubois", "Marie Laurent", "Thomas Petit", "Julie Moreau", "Nicolas Richard", "Emma Leroy", "Lucas Simon", "Camille Robert", "Antoine Garcia", "Sarah Meunier", "David Faure", "Laura Girard", "Romain Fournier", "Manon Dupuis" };

        for (int d = 30; d >= -14; d--)
        {
            var day = now.AddDays(-d).Date;
            if (day.DayOfWeek == DayOfWeek.Saturday || day.DayOfWeek == DayOfWeek.Sunday) continue;

            foreach (var (agent, tier) in agentTiers)
            {
                int apptCount = tier switch { "high" => Rng.Next(1, 4), "medium" => Rng.Next(0, 3), "low" => Rng.Next(0, 2), _ => Rng.Next(0, 2) };
                for (int a = 0; a < apptCount; a++)
                {
                    var clientName = clientNames[Rng.Next(clientNames.Length)];
                    var apptDate = d >= 0 ? day : day.AddDays(Rng.Next(1, 14));
                    var project = projectTypes[Rng.Next(projectTypes.Length)];
                    var clientSheet = clientName.Split(' ');
                    var emailName = clientSheet[0].ToLower() + "." + clientSheet[^1].ToLower();
                    var appointNow = now;

                    appointments.Add(new CrmAppointment
                    {
                        AgentId = agent.Id,
                        ClientName = clientName,
                        ClientPhone = $"0{Rng.Next(6, 7)} {Rng.Next(10, 99)} {Rng.Next(10, 99)} {Rng.Next(10, 99)} {Rng.Next(10, 99)}",
                        ClientEmail = $"{emailName}@gmail.com",
                        ProjectType = project,
                        AppointmentDate = apptDate,
                        AppointmentTime = $"{Rng.Next(8, 17):D2}:00",
                        QualityScore = Rng.Next(35, 100),
                        FinancingStatus = Rng.NextDouble() > 0.25 ? "accepté" : "en_attente",
                        Status = d > 3 ? "confirmed" : d >= 0 ? "pending" : Rng.NextDouble() > 0.15 ? "done" : "cancelled",
                        Revenus = Rng.Next(22000, 95000),
                        Chauffage = chauffageOpts[Rng.Next(chauffageOpts.Length)],
                        Toiture = toitureOpts[Rng.Next(toitureOpts.Length)],
                        Isolation = isolationOpts[Rng.Next(isolationOpts.Length)],
                        Consommation = (float)Rng.Next(8000, 35000),
                        CreditScore = Rng.Next(350, 1000),
                        SituationBancaire = banqueOpts[Rng.Next(banqueOpts.Length)],
                        Notes = Rng.NextDouble() > 0.4
                            ? (Rng.NextDouble() > 0.5
                                ? "Client intéressé, bien préparé, demande un second rendez-vous pour sa conjointe."
                                : "À relancer dans 15 jours, hésite encore sur le financement.")
                            : null,
                        CreatedAt = apptDate.AddDays(-Rng.Next(1, 21)),
                        UpdatedAt = apptDate,
                    });
                }
            }
        }
        context.CrmAppointments.AddRange(appointments);
        await context.SaveChangesAsync(cancellationToken);

        // ── 5. ATTENDANCE ──
        var attendances = new List<Attendance>();
        for (int d = 60; d >= 0; d--)
        {
            var day = now.AddDays(-d).Date;
            if (day.DayOfWeek == DayOfWeek.Saturday || day.DayOfWeek == DayOfWeek.Sunday) continue;
            foreach (var (agent, tier) in agentTiers)
            {
                if (Rng.NextDouble() > 0.88) continue;
                var isLate = tier == "low" && Rng.NextDouble() > 0.6;
                var isEarlyLeave = tier == "low" && Rng.NextDouble() > 0.7;
                var clockIn = day.AddHours(8).AddMinutes(isLate ? Rng.Next(15, 60) : Rng.Next(0, 15));
                var clockOut = day.AddHours(17).AddMinutes(isEarlyLeave ? -Rng.Next(15, 45) : Rng.Next(0, 30));
                var isBreak = Rng.NextDouble() < 0.12;

                attendances.Add(new Attendance
                {
                    UserId = agent.Id,
                    Date = day,
                    ClockIn = clockIn,
                    ClockOut = clockOut,
                    Status = isBreak ? "break" : "active",
                    CreatedAt = clockIn,
                });
            }
        }
        context.Attendances.AddRange(attendances);
        await context.SaveChangesAsync(cancellationToken);

        // ── 6. ATTENDANCE BREAKS ──
        var breakTypes = new[] { "Pause déjeuner", "Pause café", "Pause" };
        context.AttendanceBreaks.AddRange(attendances.Where(a => a.Status == "break").Select(a =>
        {
            var startBreak = a.ClockIn.AddHours(3).AddMinutes(Rng.Next(-15, 30));
            return new AttendanceBreak
            {
                AttendanceId = a.Id,
                Type = breakTypes[Rng.Next(breakTypes.Length)],
                StartTime = startBreak,
                EndTime = startBreak.AddMinutes(Rng.Next(15, 60)),
                DurationMinutes = Rng.Next(15, 60),
            };
        }));
        await context.SaveChangesAsync(cancellationToken);

        // ── 7. FOLLOWUPS ──
        var followupStatuses = new[] { "a_relancer", "relance_en_cours", "converti", "perdu" };
        context.Followups.AddRange(agentTiers.SelectMany(t =>
            Enumerable.Range(0, Rng.Next(5, 18)).Select(_ => new Followup
            {
                AgentId = t.user.Id,
                AgentName = t.user.Name,
                AppointmentDate = now.AddDays(Rng.Next(-35, 20)),
                Status = followupStatuses[Rng.Next(followupStatuses.Length)],
                RelanceCount = Rng.Next(0, 5),
                UpdatedAt = now.AddDays(-Rng.Next(0, 12)),
            })
        ));
        await context.SaveChangesAsync(cancellationToken);

        // ── 8. LEADS ──
        var leadStatuses = new[] { "Hot - Prêt à acheter", "Warm - Intéressé", "Cold - À qualifier", "RDV client", "Rappel", "Refus", "Hors cible" };
        var campaignNames = new[] { "Campagne isolation 2026", "Solaire printemps 2026", "PAC rénovation énergétique", "Toiture grand sud", "Chaudière performance hiver" };
        var streets = new[] { "Rue de la République", "Avenue des Champs-Élysées", "Boulevard Haussmann", "Rue du Faubourg Saint-Honoré", "Avenue Victor Hugo", "Place de la Bastille", "Rue de Rivoli", "Boulevard Saint-Germain", "Rue du Commerce", "Avenue des Ternes" };

        context.Leads.AddRange(Enumerable.Range(1, 80).Select(i =>
        {
            var firstName = firstNames[Rng.Next(firstNames.Length)];
            var lastName = lastNames[Rng.Next(lastNames.Length)];
            return new Lead
            {
                CompanyName = Rng.NextDouble() > 0.3
                    ? $"{lastName} {new[] { "SARL", "SAS", "EI", "EURL" }[Rng.Next(4)]}"
                    : null,
                ContactName = $"{firstName} {lastName}",
                Phone = $"0{Rng.Next(6, 7)} {Rng.Next(10, 99)} {Rng.Next(10, 99)} {Rng.Next(10, 99)} {Rng.Next(10, 99)}",
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}{Rng.Next(10, 99)}@gmail.com",
                Address = $"{Rng.Next(1, 250)} {streets[Rng.Next(streets.Length)]}",
                Status = leadStatuses[Rng.Next(leadStatuses.Length)],
                PostalCode = postalCodes[Rng.Next(postalCodes.Length)],
                AgentId = agentTiers[Rng.Next(agentTiers.Count)].user.Id,
                CampaignName = campaignNames[Rng.Next(campaignNames.Length)],
            };
        }));
        await context.SaveChangesAsync(cancellationToken);

        // ── 9. MESSAGES ──
        var messageContents = new[]
        {
            "Merci de vérifier le dossier client #1423 avant l'appel, il y a des informations bancaires à mettre à jour.",
            "Réunion d'équipe demain à 9h dans la salle de conférence. Ordre du jour : résultats mensuels et objectifs.",
            "Le nouveau script de qualification est disponible sur le drive partagé. Prenez le temps de le lire avant vos appels.",
            "Pouvez-vous relancer le prospect Dupont ? Il attend notre retour pour la signature du devis.",
            "Félicitations à toute l'équipe pour les bons résultats de cette semaine ! 15 conversions, meilleur score du trimestre !",
            "N'oubliez pas de renseigner vos pointages en fin de journée. Le service RH fait le point demain.",
            "Le client Martin a confirmé son RDV pour jeudi à 14h. Préparez les documents techniques.",
            "Objectif de la semaine : 15 appels qualifiés par agent. On se donne à fond pour atteindre le bonus collectif !",
            "Superbe closing de Sana aujourd'hui sur le dossier isolation thermique. Un client très exigeant qui est signé !",
            "Le commercial Ali M. a décroché le plus gros contrat du mois : 24 panneaux solaires pour une villa à Lyon.",
            "Pensez à mettre à jour le CRM après chaque appel, même si le client n'est pas intéressé.",
            "La formation sur les nouveaux produits PAC aura lieu vendredi à 14h. Présence obligatoire.",
            "Rappel : la campagne d'été démarre lundi prochain. Assurez-vous d'avoir vos listes d'appels à jour.",
            "Kevin, peux-tu passer voir le responsable qualité avant ta pause ? Il a des retours sur tes derniers appels.",
            "Nouveau leads disponibles dans le pool. Les plus réactifs décrochent les meilleurs prospects !",
        };

        context.Messages.AddRange(agentTiers.SelectMany((t, idx) =>
            Enumerable.Range(0, Rng.Next(4, 12)).Select(_ => new Message
            {
                SenderId = agentTiers[Rng.Next(agentTiers.Count)].user.Id,
                ReceiverId = agentTiers[Rng.Next(agentTiers.Count)].user.Id,
                Content = messageContents[Rng.Next(messageContents.Length)],
                IsUrgent = Rng.NextDouble() < 0.12,
                IsRead = Rng.NextDouble() > 0.25,
                CreatedAt = now.AddDays(-Rng.Next(0, 30)).AddHours(Rng.Next(8, 18)),
                ReadAt = Rng.NextDouble() > 0.25 ? now.AddDays(-Rng.Next(0, 29)).AddHours(Rng.Next(8, 18)) : null,
            })
        ));
        await context.SaveChangesAsync(cancellationToken);

        // ── 10. MANUAL EVALUATIONS ──
        var evalComments = new[]
        {
            "Écoute active satisfaisante, améliorer la gestion des objections sur le budget.",
            "Excellent argumentaire commercial, bien structuré. Client mis en confiance.",
            "Bon respect du script mais trop de temps consacré aux aspects techniques. Accélérer la conclusion.",
            "Très bonne gestion du refus client, a su rebondir sur les objections prix.",
            "Qualification parfaite. Tous les critères de l'éligibilité ont été vérifiés.",
            "Trop de jargon technique. Le client n'a pas compris la différence entre les offres.",
            "Discours commercial fluide et naturel. Le client s'est senti accompagné.",
            "À travailler : la gestion du temps de parole. L'agent parle trop et n'écoute pas assez.",
            "Excellente capacité à recueillir les informations clés du dossier client.",
            "Rupture de script détectée lors de la phase de objection prix, mais bien rattrapée.",
        };

        var evalScoresOptions = new[]
        {
            "{\"ecoute\":85,\"persuasion\":72,\"empathie\":90,\"argumentation\":68,\"refus\":55,\"vente\":78}",
            "{\"ecoute\":90,\"persuasion\":88,\"empathie\":92,\"argumentation\":85,\"refus\":80,\"vente\":86}",
            "{\"ecoute\":65,\"persuasion\":55,\"empathie\":70,\"argumentation\":50,\"refus\":45,\"vente\":52}",
            "{\"ecoute\":78,\"persuasion\":82,\"empathie\":75,\"argumentation\":80,\"refus\":72,\"vente\":84}",
            "{\"ecoute\":95,\"persuasion\":90,\"empathie\":88,\"argumentation\":92,\"refus\":85,\"vente\":91}",
            "{\"ecoute\":50,\"persuasion\":42,\"empathie\":55,\"argumentation\":38,\"refus\":35,\"vente\":40}",
        };

        context.ManualEvaluations.AddRange(agentTiers.Select((t, i) => new ManualEvaluation
        {
            AgentId = t.user.Id,
            EvaluatorId = qualite.Id,
            EvaluationDate = now.AddDays(-Rng.Next(0, 30)),
            CallRef = $"CALL-{Rng.Next(10000, 99999)}",
            GlobalScore = t.tier switch { "high" => (float)Rng.Next(75, 98), "medium" => (float)Rng.Next(55, 80), "low" => (float)Rng.Next(35, 60), _ => (float)Rng.Next(35, 60) },
            Decision = Rng.NextDouble() > 0.25 ? "validé" : "à_revoir",
            Commentaires = evalComments[Rng.Next(evalComments.Length)],
            ScoresJson = evalScoresOptions[Rng.Next(evalScoresOptions.Length)],
            CreatedAt = now.AddDays(-Rng.Next(0, 30)),
        }));
        await context.SaveChangesAsync(cancellationToken);

        // ── 11. ALERT HISTORY ──
        var alertMessages = new[]
        {
            ("critical", "score", "Score de persuasion critique inférieur à 40%"),
            ("warning", "inactivity", "Inactivité prolongée détectée : plus de 45 minutes sans appel"),
            ("info", "achievement", "Performance exceptionnelle : taux de conversion supérieur à 80% ce mois-ci"),
            ("warning", "script", "Rupture de script détectée sur appel entrant - vérification nécessaire"),
            ("critical", "refus", "Taux de refus supérieur à 50% cette semaine - action corrective requise"),
            ("info", "achievement", "Objectif mensuel atteint avec 15 jours d'avance !"),
            ("warning", "attendance", "Retard récurrent détecté sur les 3 derniers jours"),
            ("critical", "quality", "Note qualité inférieure au seuil minimum de 40/100"),
            ("info", "achievement", "Meilleur score d'écoute du mois : 92/100"),
            ("warning", "refus", "Pic de refus détecté sur les appels de l'après-midi"),
        };

        context.AlertHistories.AddRange(Enumerable.Range(0, 35).Select(i =>
        {
            var (sev, cat, msg) = alertMessages[Rng.Next(alertMessages.Length)];
            return new AlertHistory
            {
                AgentName = agentTiers[Rng.Next(agentTiers.Count)].user.Name,
                AlertType = cat,
                Severity = sev,
                Message = msg,
                ThresholdValue = 50,
                ActualValue = (float)Rng.Next(20, 100),
                CreatedAt = now.AddMinutes(-Rng.Next(0, 60 * 24 * 15)),
            };
        }));
        await context.SaveChangesAsync(cancellationToken);

        // ── 12. SALARIES ──
        var salaryMonths = new[] { now.AddMonths(-2).ToString("yyyy-MM"), now.AddMonths(-1).ToString("yyyy-MM") };
        context.Salaries.AddRange(salaryMonths.SelectMany(month => agentTiers.Select(t =>
        {
            var baseSalary = 1500f;
            var (rdvMin, rdvMax) = t.tier switch { "high" => (12, 30), "medium" => (6, 20), "low" => (3, 12), _ => (3, 12) };
            var (poseMin, poseMax) = t.tier switch { "high" => (3, 12), "medium" => (1, 6), "low" => (0, 3), _ => (0, 3) };
            var (refusMin, refusMax) = t.tier switch { "high" => (3, 12), "medium" => (8, 22), "low" => (15, 35), _ => (15, 35) };

            var rdvCount = Rng.Next(rdvMin, rdvMax);
            var poseCount = Rng.Next(poseMin, poseMax);
            var refusCount = Rng.Next(refusMin, refusMax);
            var qualityRate = t.tier switch { "high" => (float)Rng.Next(75, 98), "medium" => (float)Rng.Next(55, 80), "low" => (float)Rng.Next(35, 60), _ => (float)Rng.Next(35, 60) };

            var rdvBonus = rdvCount * 50f;
            var poseBonus = poseCount * 150f;
            var qualityBonus = qualityRate >= 80 ? 200f : qualityRate >= 60 ? 100f : 0f;
            var installationBonus = poseCount * 300f;
            var penalties = refusCount * 30f + (qualityRate < 50 ? 150f : 0f);
            var total = baseSalary + rdvBonus + poseCount * 300f + qualityBonus + installationBonus - penalties;

            return new Salary
            {
                AgentId = t.user.Id,
                Month = month,
                BaseSalary = baseSalary,
                RdvCount = rdvCount,
                PoseCount = poseCount,
                RefusCount = refusCount,
                QualityRate = qualityRate,
                RdvBonus = rdvBonus,
                PoseBonus = poseBonus,
                QualityBonus = qualityBonus,
                InstallationBonus = installationBonus,
                Penalties = penalties,
                TotalSalary = (float)Math.Round(total, 2),
                PaymentStatus = month == salaryMonths[0] ? "paid" : "pending",
            };
        })));
        await context.SaveChangesAsync(cancellationToken);

        // ── 13. SALARY RULES ──
        if (!await context.SalaryRules.AnyAsync(cancellationToken))
        {
            context.SalaryRules.AddRange(new List<SalaryRule>
            {
                new() { RuleName = "Salaire de base", RuleType = "base_salary", Amount = 1500, Role = "agent" },
                new() { RuleName = "Prime RDV", RuleType = "rdv_bonus", Amount = 50, Role = "agent" },
                new() { RuleName = "Prime pose", RuleType = "pose_bonus", Amount = 150, Role = "agent" },
                new() { RuleName = "Prime qualité", RuleType = "quality_bonus", Amount = 200, Role = "agent" },
                new() { RuleName = "Prime installation", RuleType = "installation_bonus", Amount = 300, Role = "agent" },
                new() { RuleName = "Pénalité refus", RuleType = "refus_penalty", Amount = 30, Role = "agent" },
                new() { RuleName = "Pénalité absence", RuleType = "absence_penalty", Amount = 100, Role = "agent" },
                new() { RuleName = "Salaire de base", RuleType = "base_salary", Amount = 1800, Role = "qualite" },
                new() { RuleName = "Prime qualité", RuleType = "quality_bonus", Amount = 250, Role = "qualite" },
            });
            await context.SaveChangesAsync(cancellationToken);
        }

        // ── 14. PERMISSIONS ──
        if (!await context.Permissions.AnyAsync(cancellationToken))
        {
            var permissionEntities = Authorization.Permissions.GetAll().Select(name => new Permission
            {
                Name = name,
                Module = name.Split('.')[0],
                Description = $"Permission {name}",
                CreatedAt = now
            }).ToList();

            context.Permissions.AddRange(permissionEntities);
            await context.SaveChangesAsync(cancellationToken);

            // Re-load with IDs
            var allPermissions = await context.Permissions.ToListAsync(cancellationToken);
            var permDict = allPermissions.ToDictionary(p => p.Name, p => p.Id);

            // Default role-permission mappings
            var rolePermissions = new Dictionary<string, string[]>
            {
                ["admin"] = Authorization.Permissions.GetAll(), // Admin gets everything

                ["agent"] = new[]
                {
                    Permissions.Dashboard.View,
                    Permissions.CallCRM.View, Permissions.CallCRM.MakeCall,
                    Permissions.CallCRM.ViewHistory, Permissions.CallCRM.Analyze,
                    Permissions.Contacts.View, Permissions.Contacts.Edit,
                    Permissions.Leads.View,
                    Permissions.Agenda.View, Permissions.Agenda.Create, Permissions.Agenda.Edit,
                    Permissions.Performance.View, Permissions.Performance.ViewOwn,
                    Permissions.Attendance.ClockIn, Permissions.Attendance.ClockOut,
                    Permissions.Attendance.StartBreak, Permissions.Attendance.EndBreak,
                    Permissions.Evaluations.View,
                    Permissions.Messages.View, Permissions.Messages.Send,
                    Permissions.Salaries.ViewOwn,
                    Permissions.Chatbot.View, Permissions.Chatbot.Use,
                },

                ["qualite"] = new[]
                {
                    Permissions.Dashboard.View, Permissions.Dashboard.ViewQuality, Permissions.Dashboard.ViewStats,
                    Permissions.CallCRM.View, Permissions.CallCRM.ViewHistory,
                    Permissions.CallCRM.Analyze, Permissions.CallCRM.Export,
                    Permissions.Leads.View, Permissions.Leads.Qualify,
                    Permissions.Agenda.View, Permissions.Agenda.Create, Permissions.Agenda.Edit,
                    Permissions.Agenda.Confirm, Permissions.Agenda.ManageAll,
                    Permissions.Performance.View, Permissions.Performance.ViewAgents,
                    Permissions.Performance.Compare, Permissions.Performance.Export,
                    Permissions.Attendance.ClockIn, Permissions.Attendance.ClockOut,
                    Permissions.Attendance.ViewTeam, Permissions.Attendance.Export,
                    Permissions.Evaluations.View, Permissions.Evaluations.Create,
                    Permissions.Evaluations.ViewAll, Permissions.Evaluations.Export,
                    Permissions.Messages.View, Permissions.Messages.Send,
                    Permissions.Salaries.ViewOwn,
                    Permissions.Scoring.View, Permissions.Scoring.ViewAlerts,
                    Permissions.Reports.View, Permissions.Reports.ViewAll, Permissions.Reports.Export,
                    Permissions.Chatbot.View, Permissions.Chatbot.Use,
                    Permissions.Followups.View,
                    Permissions.Analytics.View,
                }
            };

            foreach (var (role, perms) in rolePermissions)
            {
                foreach (var permName in perms)
                {
                    if (permDict.TryGetValue(permName, out var permId))
                    {
                        context.RolePermissions.Add(new RolePermission
                        {
                            Role = role,
                            PermissionId = permId,
                            CreatedAt = now
                        });
                    }
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
