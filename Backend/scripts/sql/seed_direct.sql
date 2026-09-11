-- ============================================================
-- SEED DONNÉES DE TEST — CRM EBI 2026
-- Exécuter avec : psql -U postgres -d crm_db -f seed_direct.sql
-- ============================================================

-- Vérification migrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Contacts' AND column_name='NombreNRP') THEN
        ALTER TABLE "Contacts" ADD COLUMN "NombreNRP" integer NOT NULL DEFAULT 0;
        ALTER TABLE "Contacts" ADD COLUMN "ScoreIA" double precision;
        ALTER TABLE "Contacts" ADD COLUMN "CreneauOptimalIA" text;
        ALTER TABLE "Contacts" ADD COLUMN "DateScoreIA" timestamp with time zone;
        RAISE NOTICE 'Colonnes IA ajoutées à Contacts';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name='ChatMessages') THEN
        CREATE TABLE "ChatMessages" (
            "Id" bigserial PRIMARY KEY,
            "Channel" text NOT NULL,
            "SenderId" bigint NOT NULL,
            "SenderNom" text NOT NULL,
            "SenderRole" text NOT NULL,
            "Content" text NOT NULL,
            "SentAt" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS "IX_ChatMessages_Channel_SentAt" ON "ChatMessages"("Channel", "SentAt" DESC);
        RAISE NOTICE 'Table ChatMessages créée';
    END IF;
END $$;

-- ── Récupérer les IDs des agents créés ──────────────────────
DO $$
DECLARE
    v_agent1 bigint;
    v_agent2 bigint;
    v_agent3 bigint;
BEGIN
    SELECT "Id" INTO v_agent1 FROM "Utilisateur" WHERE "Email" = 'agent1@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_agent2 FROM "Utilisateur" WHERE "Email" = 'agent2@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_agent3 FROM "Utilisateur" WHERE "Email" = 'agent3@ebi.com' LIMIT 1;

    IF v_agent1 IS NULL THEN
        RAISE NOTICE 'agent1@ebi.com introuvable — lance seed_data.py dabord';
        RETURN;
    END IF;
    RAISE NOTICE 'Agents trouvés: %, %, %', v_agent1, v_agent2, v_agent3;

    -- ── CONTACTS ────────────────────────────────────────────
    INSERT INTO "Contacts" 
        ("Nom","Prenom","Telephone","NumGSM","Email","Adresse","CodePostal","Ville",
         "Source","DateImport","Statut","StatutAgent","ModeChauffage","AgeChaudiere",
         "EquipePV","EquipePAC","Surface","NombrePersonnes","Revenus","Credits",
         "Fichage","NombreNRP","TypeRendezVous","AgentId")
    VALUES
        -- Leads chauds
        ('Martin','Pierre','0612345678','0712345678','pierre.martin@gmail.com',
         '12 rue des Lilas','69001','Lyon','FICHIER_EBI',NOW(),'EN_COURS','NRP',
         'Gaz',15,false,false,120.0,4,'Moyen','Non',false,2,'EBI',v_agent1),

        ('Dupont','Marie','0623456789',NULL,'marie.dupont@gmail.com',
         '5 allée des Roses','13001','Marseille','FICHIER_EBI',NOW(),'EN_COURS','HC_LOGEMENT',
         'Fioul',20,false,false,145.0,5,'Eleve','Non',false,1,'EBI',v_agent1),

        ('Bernard','Jean','0634567890','0734567890','jean.bernard@yahoo.fr',
         '8 rue de la Paix','75001','Paris','FICHIER_CLIENT1',NOW(),'EN_COURS',NULL,
         'Gaz',12,false,true,95.0,3,'Moyen','Oui',false,0,'CLIENT1',v_agent1),

        -- Leads froids
        ('Leclerc','Sophie','0645678901',NULL,'sophie.leclerc@hotmail.com',
         '3 impasse du Moulin','31001','Toulouse','FICHIER_EBI',NOW(),'TRAITE','REFUS_PAS_INTERESSE',
         'Pompe a chaleur',2,true,true,80.0,2,'Faible','Non',true,5,NULL,v_agent1),

        ('Rousseau','Paul','0656789012','0756789012','paul.rousseau@gmail.com',
         '15 avenue Victor Hugo','44001','Nantes','FICHIER_CLIENT2',NOW(),'EN_COURS','PORTE',
         'Electrique',3,true,false,65.0,1,'Faible','Oui',false,3,'CLIENT2',v_agent2),

        -- Contacts variés
        ('Petit','Lucie','0667890123',NULL,'lucie.petit@gmail.com',
         '7 rue Gambetta','67001','Strasbourg','FICHIER_EBI',NOW(),'EN_COURS','RDV_CLIENT1',
         'Gaz',18,false,false,110.0,3,'Moyen','Non',false,0,'CLIENT1',v_agent1),

        ('Moreau','Antoine','0678901234','0778901234','antoine.moreau@outlook.fr',
         '2 place de la Republique','59001','Lille','FICHIER_EBI',NOW(),'EN_COURS',NULL,
         'Fioul',25,false,false,160.0,6,'Eleve','Non',false,0,'EBI',v_agent1),

        ('Simon','Isabelle','0689012345',NULL,'isabelle.simon@gmail.com',
         '9 rue Saint-Nicolas','21000','Dijon','FICHIER_REFUS',NOW(),'TRAITE','REFUS_PAS_INTERESSE',
         'Gaz',8,true,false,75.0,2,'Moyen','Non',false,4,'REFUS',v_agent2)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Contacts insérés';

    -- ── POINTAGES ────────────────────────────────────────────
    INSERT INTO "Pointages" ("AgentId","Date","PremierAppel","DernierAppel","TotalSecondesTravaillees")
    VALUES
        (v_agent1, NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day 7 hours',  NOW() - INTERVAL '1 day 1 hour',  21600),
        (v_agent1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days 7 hours', NOW() - INTERVAL '2 days 1 hour', 25200),
        (v_agent2, NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day 8 hours',  NOW() - INTERVAL '1 day 1 hour',  19800),
        (v_agent3, NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day 7 hours',  NOW() - INTERVAL '1 day 2 hours', 22500)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Pointages insérés';
END $$;

-- ── ÉVALUATIONS ──────────────────────────────────────────────
DO $$
DECLARE
    v_agent1 bigint;
    v_agent2 bigint;
    v_qualite bigint;
BEGIN
    SELECT "Id" INTO v_agent1 FROM "Utilisateur" WHERE "Email" = 'agent1@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_agent2 FROM "Utilisateur" WHERE "Email" = 'agent2@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_qualite FROM "Utilisateur" WHERE "Email" = 'qualite@ebi.com' LIMIT 1;

    IF v_agent1 IS NULL OR v_qualite IS NULL THEN
        RAISE NOTICE 'Agents/qualite introuvables pour évaluations';
        RETURN;
    END IF;

    INSERT INTO "Evaluations" 
        ("AgentId","EvaluateurId","DateEvaluation","NoteGlobale",
         "NotePitchCommercial","NoteTraitementObjections","NoteQualiteAppel",
         "NoteRespectScript","NoteEcoute","Commentaire",
         "NbRdvBrut","NbRdvConfirme","NbRdvSigne")
    VALUES
        (v_agent1, v_qualite, NOW() - INTERVAL '7 days', 8.5,
         9.0, 8.0, 8.5, 7.5, 9.5,
         'Très bon pitch, gestion des objections à améliorer', 12, 8, 5),
        (v_agent2, v_qualite, NOW() - INTERVAL '7 days', 7.0,
         7.5, 6.5, 7.0, 8.0, 6.5,
         'Progrès notables, continuer sur la lancée', 8, 5, 3)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Evaluations insérées';
END $$;

-- ── SCORES IA MANUELS (pour tester le dashboard IA) ──────────
UPDATE "Contacts" SET
    "ScoreIA" = CASE
        WHEN "StatutAgent" = 'NRP'  THEN 72.5
        WHEN "StatutAgent" = 'HC_LOGEMENT' THEN 85.0
        WHEN "StatutAgent" IS NULL  THEN 65.0
        WHEN "StatutAgent" LIKE 'REFUS%' THEN 22.0
        WHEN "StatutAgent" = 'PORTE' THEN 38.0
        WHEN "StatutAgent" LIKE 'RDV%' THEN 60.0
        ELSE 50.0
    END,
    "DateScoreIA" = NOW(),
    "CreneauOptimalIA" = CASE
        WHEN "ScoreIA" > 70 THEN '09:00-11:00'
        WHEN "ScoreIA" > 40 THEN '14:00-17:00'
        ELSE '17:00-19:00'
    END
WHERE "ScoreIA" IS NULL;

-- ── MESSAGES CHAT DÉMO ────────────────────────────────────────
DO $$
DECLARE
    v_admin bigint;
    v_agent1 bigint;
BEGIN
    SELECT "Id" INTO v_admin FROM "Utilisateur" WHERE "Role" = 'ADMIN' LIMIT 1;
    SELECT "Id" INTO v_agent1 FROM "Utilisateur" WHERE "Email" = 'agent1@ebi.com' LIMIT 1;

    IF v_admin IS NOT NULL AND v_agent1 IS NOT NULL THEN
        INSERT INTO "ChatMessages" ("Channel","SenderId","SenderNom","SenderRole","Content","SentAt")
        VALUES
            ('GENERAL', v_admin, 'Système Admin', 'ADMIN', 
             'Bienvenue dans le CRM EBI ! Les objectifs de ce mois sont disponibles dans Analytics.', 
             NOW() - INTERVAL '2 hours'),
            ('AGENTS',  v_agent1, 'Karim Mansouri', 'AGENT',
             'Bonjour équipe ! 3 RDV confirmés ce matin, bonne journée à tous !',
             NOW() - INTERVAL '1 hour'),
            ('GENERAL', v_admin, 'Système Admin', 'ADMIN',
             'Rappel : réunion équipe demain à 9h.',
             NOW() - INTERVAL '30 minutes')
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Messages chat insérés';
    END IF;
END $$;

SELECT 'Seed terminé !' AS statut, COUNT(*) AS nb_contacts FROM "Contacts";
