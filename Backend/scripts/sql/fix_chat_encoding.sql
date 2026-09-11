-- Fix encodage UTF-8 des messages chat + ajout données de test
UPDATE "ChatMessages"
SET "SenderName" = 'Système Admin'
WHERE "SenderName" LIKE '%Admin%' AND "SenderName" != 'Système Admin';

-- Vérifier l'état actuel
SELECT "Id", "SenderName", "Content", "Channel" FROM "ChatMessages" ORDER BY "SentAt";
