// Script pour ajouter une colonne description à la table projects dans Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé de service avec droits d'admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis.');
  process.exit(1);
}

// Création du client Supabase avec la clé de service (pour avoir les droits admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDescriptionColumn() {
  try {
    // Vérifier si la colonne existe déjà
    console.log('Vérification de la colonne description...');
    
    // Exécuter une requête SQL directement pour ajouter la colonne
    const { error } = await supabase.rpc('add_description_column_to_projects');
    
    if (error) {
      // Si la fonction RPC n'existe pas, créons-la d'abord
      console.log('Création de la fonction RPC et ajout de la colonne...');
      
      // Création de la fonction RPC et ajout de la colonne en une seule requête
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `
          -- Créer la fonction RPC si elle n'existe pas
          CREATE OR REPLACE FUNCTION add_description_column_to_projects()
          RETURNS void AS $$
          BEGIN
            -- Vérifier si la colonne existe déjà
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'description'
            ) THEN
              -- Ajouter la colonne description
              ALTER TABLE projects ADD COLUMN description TEXT;
            END IF;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Exécuter la fonction
          SELECT add_description_column_to_projects();
        `
      });
      
      if (createError) {
        // Si exec_sql n'existe pas non plus, nous devons utiliser une approche alternative
        console.error('Erreur lors de la création de la fonction:', createError);
        console.log('Tentative d\'approche alternative...');
        
        // Utilisez pgSQL pour créer la colonne directement
        const { error: sqlError } = await supabase.from('_exec_sql').insert({
          query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;'
        });
        
        if (sqlError) {
          throw new Error(`Erreur lors de l'ajout de la colonne: ${sqlError.message}`);
        }
      }
      
      console.log('Colonne description ajoutée avec succès à la table projects!');
    } else {
      console.log('Colonne description ajoutée avec succès à la table projects!');
    }
    
    // Vérifier que la colonne a bien été ajoutée
    const { data, error: checkError } = await supabase
      .from('projects')
      .select('description')
      .limit(1);
      
    if (checkError) {
      console.error('Erreur lors de la vérification de la colonne:', checkError);
    } else {
      console.log('Vérification réussie: la colonne description existe maintenant dans la table projects.');
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

// Exécuter la fonction principale
addDescriptionColumn().finally(() => {
  console.log('Script terminé.');
  process.exit(0);
}); 