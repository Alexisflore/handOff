-- Script pour ajouter une colonne 'description' à la table 'projects'
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    -- Vérifier si la colonne existe déjà
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'description'
    ) THEN
        -- Ajouter la colonne description
        ALTER TABLE projects ADD COLUMN description TEXT;
        RAISE NOTICE 'Colonne description ajoutée avec succès à la table projects';
    ELSE
        RAISE NOTICE 'La colonne description existe déjà dans la table projects';
    END IF;
END $$; 