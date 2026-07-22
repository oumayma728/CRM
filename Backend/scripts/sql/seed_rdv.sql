-- ── 1. Insérer les contacts ───────────────────────────────────────────────────
INSERT INTO "Contacts" ("Nom","Prenom","Telephone","NumGSM","Email","Adresse","CodePostal","Ville","Source","DateImport","Statut","ModeChauffage","AgeChaudiere","Surface","EquipePV","Commentaire","TypeRendezVous","NombreNRP")
VALUES
('Martin',  'Jean',     '0241567890','0641567890','jean.martin@gmail.com',    '8 rue des Lilas',      '49000','Angers',           'Terrain',NOW(),'A_APPELER','Gaz',       8, 90.0,false,'Chaudière 8 ans à remplacer',         'EBI',    0),
('Dubois',  'Marie',    '0251789012','0751789012','marie.dubois@orange.fr',   '22 bd de la Mer',      '85000','La Roche-sur-Yon', 'Fichier',NOW(),'A_APPELER','Electrique', 5, 75.0,false,'Intéressée PAC air/air',              'EBI',    0),
('Bernard', 'Pierre',   '0299456123','0699456123','p.bernard@gmail.com',      '3 impasse du Moulin',  '35000','Rennes',           'Terrain',NOW(),'A_APPELER','Fioul',     12,110.0,false,'Vieux fioul, veut basculer PAC',       'CLIENT1',0),
('Leroy',   'Sophie',   '0231234567','0631234567','sophie.leroy@hotmail.com', '47 rue Victor Hugo',   '14000','Caen',             'Fichier',NOW(),'A_APPELER','Electrique', 3, 65.0,true, 'Équipée PV, cherche PAC',             'CLIENT1',0),
('Moreau',  'Luc',      '0262345678','0762345678','luc.moreau@gmail.com',     '12 allée des Roses',   '44300','Nantes',           'Terrain',NOW(),'A_APPELER','Gaz',        6, 85.0,false,'Couple propriétaire, projet PAC',      'CLIENT2',0),
('Simon',   'Nathalie', '0243567890','0743567890','nathalie.simon@free.fr',   '5 chemin du Bois',     '72000','Le Mans',          'Fichier',NOW(),'A_APPELER','Fioul',      15,120.0,false,'Maison ancienne, isolation à refaire', 'CLIENT2',0);

-- ── 2. Insérer les RDV liés ───────────────────────────────────────────────────
DO $$
DECLARE
  agent_id BIGINT;
  c1 BIGINT; c2 BIGINT; c3 BIGINT; c4 BIGINT; c5 BIGINT; c6 BIGINT;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT "Id" INTO agent_id FROM "Utilisateur" WHERE "Role" = 'AGENT' ORDER BY "Id" LIMIT 1;

  SELECT "Id" INTO c1 FROM "Contacts" WHERE "Nom"='Martin'  AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;
  SELECT "Id" INTO c2 FROM "Contacts" WHERE "Nom"='Dubois'  AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;
  SELECT "Id" INTO c3 FROM "Contacts" WHERE "Nom"='Bernard' AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;
  SELECT "Id" INTO c4 FROM "Contacts" WHERE "Nom"='Leroy'   AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;
  SELECT "Id" INTO c5 FROM "Contacts" WHERE "Nom"='Moreau'  AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;
  SELECT "Id" INTO c6 FROM "Contacts" WHERE "Nom"='Simon'   AND "DateImport"::date = today ORDER BY "Id" DESC LIMIT 1;

  INSERT INTO "RendezVous" ("ContactId","AgentId","DateCreation","DateRendezVous","Statut","TypeRendezVous","Commentaire","ARecontacter")
  VALUES
  (c1, agent_id, NOW(), today + TIME '09:00', 0, 'EBI',     'Chaudière 8 ans à remplacer',         false),
  (c2, agent_id, NOW(), today + TIME '10:30', 1, 'EBI',     'Intéressée PAC air/air',              false),
  (c3, agent_id, NOW(), today + TIME '11:00', 0, 'CLIENT1', 'Vieux fioul, veut basculer PAC',      false),
  (c4, agent_id, NOW(), today + TIME '14:00', 1, 'CLIENT1', 'Équipée PV, cherche PAC',             false),
  (c5, agent_id, NOW(), today + TIME '15:00', 0, 'CLIENT2', 'Couple propriétaire, projet PAC',     false),
  (c6, agent_id, NOW(), today + TIME '16:00', 1, 'CLIENT2', 'Maison ancienne, isolation à refaire',false);

  RAISE NOTICE 'OK — 6 RDV insérés pour agent ID: %', agent_id;
END $$;

-- ── 3. Vérification ───────────────────────────────────────────────────────────
SELECT r."Id",
       c."Prenom" || ' ' || c."Nom"  AS contact,
       c."Telephone",
       to_char(r."DateRendezVous",'DD/MM HH24:MI') AS rdv,
       CASE r."Statut" WHEN 0 THEN 'BRUT' WHEN 1 THEN 'CONFIRME' ELSE r."Statut"::text END AS statut,
       r."TypeRendezVous"
FROM "RendezVous" r
JOIN "Contacts" c ON c."Id" = r."ContactId"
WHERE r."DateRendezVous"::date = CURRENT_DATE
ORDER BY r."DateRendezVous";
