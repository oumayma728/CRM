-- Comptes de test (un par rôle) pour les tests E2E / démo locale. Mot de passe : Test1234!
-- NE PAS exécuter en production.
INSERT INTO "Utilisateur" ("Nom","Prenom","Email","MotDePasse","Role","Actif","Statut","DateCreation","MustChangePassword","Type","TypeContrat","ObjectifMensuel","SalaireBase","PrimeAssiduite")
SELECT v.nom, v.prenom, v.email, '$2b$11$KxWerMSHNodyB4AHLRPn1ufgyD.QQLs2r2GIWY6mHucFo5RRaLHjq', v.role, true, 'ACTIF', now(), false, v.type, v.contrat, v.objectif, v.salaire, v.prime
FROM (VALUES
  ('Root','Sam','superadmin@ebi.com','SuperAdmin',NULL,NULL,NULL::int,NULL::numeric,NULL::numeric),
  ('Admin','Alice','admin@ebi.com','ADMIN',NULL,NULL,NULL,NULL,NULL),
  ('Agent','Karim','agent@ebi.com','AGENT',NULL,'PLEIN_TEMPS',22,900,100),
  ('Qualite','Quentin','qualite@ebi.com','QUALITE',NULL,NULL,NULL,NULL,NULL),
  ('Commercial','Carla','commercial@ebi.com','COMMERCIAL',NULL,NULL,NULL,NULL,NULL),
  ('Tech','Theo','tech@ebi.com','TECH',NULL,NULL,NULL,NULL,NULL),
  ('Conf','Una','conf1@ebi.com','CONFIRMATRICE','CONF1',NULL,NULL,NULL,NULL),
  ('Conf','Deux','conf2@ebi.com','CONFIRMATRICE','CONF2',NULL,NULL,NULL,NULL),
  ('Conf','Client','confclient@ebi.com','CONFIRMATRICE','CONFCLIENT',NULL,NULL,NULL,NULL)
) AS v(nom, prenom, email, role, type, contrat, objectif, salaire, prime)
WHERE NOT EXISTS (SELECT 1 FROM "Utilisateur" u WHERE u."Email" = v.email);
