-- Seed RendezVous (1 RDV par contact max, contrainte IX_RendezVous_ContactId)
DO $$
DECLARE
    v_agent1 BIGINT; v_agent2 BIGINT; v_agent3 BIGINT;
    ids BIGINT[];
    v_c1 BIGINT; v_c2 BIGINT; v_c3 BIGINT;
    v_c4 BIGINT; v_c5 BIGINT; v_c6 BIGINT; v_c7 BIGINT;
BEGIN
    SELECT "Id" INTO v_agent1 FROM "Utilisateur" WHERE "Email" = 'agent1@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_agent2 FROM "Utilisateur" WHERE "Email" = 'agent2@ebi.com' LIMIT 1;
    SELECT "Id" INTO v_agent3 FROM "Utilisateur" WHERE "Email" = 'agent3@ebi.com' LIMIT 1;

    IF v_agent1 IS NULL THEN
        RAISE NOTICE 'Agents introuvables';
        RETURN;
    END IF;

    -- Supprimer les RDV existants pour repartir proprement
    DELETE FROM "RendezVous";

    -- Recuperer 7 contacts distincts (tous agents confondus)
    SELECT array_agg("Id") INTO ids FROM (
        SELECT "Id" FROM "Contacts"
        WHERE "AgentId" IN (v_agent1, v_agent2, v_agent3)
        ORDER BY "Id"
        LIMIT 7
    ) t;

    IF array_length(ids, 1) < 7 THEN
        RAISE NOTICE 'Pas assez de contacts (trouvés: %)', array_length(ids, 1);
        RETURN;
    END IF;

    v_c1 := ids[1]; v_c2 := ids[2]; v_c3 := ids[3]; v_c4 := ids[4];
    v_c5 := ids[5]; v_c6 := ids[6]; v_c7 := ids[7];

    -- BRUT (agenda EBI + agenda Client 1)
    INSERT INTO "RendezVous"
        ("ContactId","AgentId","DateCreation","DateRendezVous","Statut","TypeProjet","Commentaire","ARecontacter")
    VALUES
        (v_c1, v_agent1, NOW()-'3 days'::interval,  NOW()+'2 days'::interval,  0, 'PV',      'Client interesse panneaux', false),
        (v_c2, v_agent1, NOW()-'2 days'::interval,  NOW()+'4 days'::interval,  0, 'PAC',     'Proprietaire depuis 5 ans', false),
        (v_c3, v_agent2, NOW()-'1 day'::interval,   NOW()+'1 day'::interval,   0, 'PV',      'Maison 120m2 bien exposee', false);

    -- CONFIRME (agenda EBI)
    INSERT INTO "RendezVous"
        ("ContactId","AgentId","DateCreation","DateRendezVous","Statut","TypeProjet","Commentaire","ARecontacter")
    VALUES
        (v_c4, v_agent1, NOW()-'5 days'::interval,  NOW()+'3 days'::interval,  1, 'PV',      'RDV confirme couple present', false),
        (v_c5, v_agent2, NOW()-'4 days'::interval,  NOW()+'5 days'::interval,  1, 'Chaudiere','Chaudiere 12 ans a remplacer',false);

    -- ANNULE (agenda Refus)
    INSERT INTO "RendezVous"
        ("ContactId","AgentId","DateCreation","DateRendezVous","Statut","TypeProjet","Commentaire","MotifRefus","ARecontacter")
    VALUES
        (v_c6, v_agent1, NOW()-'7 days'::interval,  NOW()-'2 days'::interval,  2, 'PV',      'Client pas interesse', 'Pas de budget', false);

    -- SIGNE
    INSERT INTO "RendezVous"
        ("ContactId","AgentId","DateCreation","DateRendezVous","Statut","TypeProjet","Commentaire","ARecontacter")
    VALUES
        (v_c7, v_agent3, NOW()-'10 days'::interval, NOW()-'5 days'::interval,  5, 'PAC',     'Signe installation prevue', false);

    RAISE NOTICE 'Seed RDV OK : 7 rendez-vous inseres (BRUT:3, CONFIRME:2, ANNULE:1, SIGNE:1)';
    RAISE NOTICE 'Contacts utilises : %, %, %, %, %, %, %', v_c1, v_c2, v_c3, v_c4, v_c5, v_c6, v_c7;
END $$;
