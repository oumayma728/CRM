-- Fix mots de passe des comptes créés avec password vide
-- Les agents/users du premier run ont un hash de "" au lieu de leur vrai mot de passe

-- On met à jour TOUS les comptes test avec le bon hash BCrypt
-- BCrypt hash de "Agent@2026" — généré offline
-- On va passer par une approche différente : reset via le hash connu de "role123"
-- (même hash que l'admin) car on ne peut pas générer BCrypt en SQL pur PostgreSQL

-- Approche : remettre tous les comptes test en Statut='EN_ATTENTE' avec MotDePasse = hash("role123")
-- Le hash BCrypt de "role123" est extrait de l'admin existant
UPDATE "Utilisateur" u
SET "MotDePasse" = (
    SELECT "MotDePasse" FROM "Utilisateur" WHERE "Email" = 'admin@ebi.com' LIMIT 1
),
"Statut" = 'EN_ATTENTE'
WHERE "Email" IN (
    'agent1@ebi.com', 'agent2@ebi.com', 'agent3@ebi.com',
    'conf1@ebi.com', 'conf2@ebi.com', 'confc@ebi.com',
    'comm@ebi.com', 'qualite@ebi.com', 'tech@ebi.com'
);

SELECT "Email", "Statut", LEFT("MotDePasse", 20) AS hash_debut
FROM "Utilisateur"
WHERE "Email" IN (
    'agent1@ebi.com', 'agent2@ebi.com', 'agent3@ebi.com',
    'conf1@ebi.com', 'conf2@ebi.com', 'confc@ebi.com',
    'comm@ebi.com', 'qualite@ebi.com', 'tech@ebi.com'
)
ORDER BY "Email";
