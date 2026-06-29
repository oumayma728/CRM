-- Renommer SenderNom → SenderName (nom attendu par l'entité C# ChatMessage)
ALTER TABLE "ChatMessages" RENAME COLUMN "SenderNom" TO "SenderName";

-- Vérification
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ChatMessages' ORDER BY ordinal_position;
