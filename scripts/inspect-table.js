// Script pour inspecter la structure d'une table Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Vérifier les variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérifier si les variables essentielles sont définies
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes. Veuillez vérifier votre fichier .env.local');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Table à inspecter
const TABLE_NAME = 'deliverables';

async function inspectTable() {
  try {
    console.log(`Inspection de la table "${TABLE_NAME}"...`);

    // Récupérer un échantillon de données
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur lors de la récupération des données:', error);
      return;
    }

    // Si aucune donnée n'existe, essayer de vérifier la structure sans données
    if (!data || data.length === 0) {
      console.log('ℹ️ Aucune donnée trouvée dans la table. Vérification de la structure sans données...');
      
      try {
        // Essayer d'accéder à la définition de la table via l'API système de Supabase si disponible
        const { data: definitions, error: defError } = await supabase
          .rpc('get_table_definition', { table_name: TABLE_NAME });
        
        if (defError) {
          console.error('❌ Impossible de récupérer la définition de la table:', defError);
        } else if (definitions) {
          console.log('📋 Définition de la table:');
          console.log(definitions);
        }
      } catch (e) {
        console.log('ℹ️ La fonction RPC get_table_definition n\'est peut-être pas disponible');
      }
      
      // Essayer une insertion directe de test
      console.log('\n📝 Tentative d\'insertion de test pour identifier les colonnes obligatoires...');
      
      // Récupérer des valeurs valides pour les clés étrangères
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
        
      const { data: stepData } = await supabase
        .from('steps')
        .select('id')
        .limit(1);
      
      const projectId = projectData && projectData.length > 0 ? projectData[0].id : 'test-project-id';
      const stepId = stepData && stepData.length > 0 ? stepData[0].id : 'test-step-id';
      
      const testData = {
        title: 'TEST_STRUCTURE_' + Date.now(),
        description: 'Test pour inspecter la structure',
        file_url: 'https://example.com/test.png',
        file_name: 'test.png',
        file_type: 'image/png',
        step_id: stepId,
        project_id: projectId,
        version_name: 'Test Version',
        is_latest: true,
        status: 'completed'
      };
      
      console.log('Données de test:', testData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([testData])
        .select();
      
      if (insertError) {
        console.error('❌ Erreur d\'insertion:', insertError);
        
        // Analyser l'erreur pour identifier les contraintes ou champs requis
        if (insertError.message && insertError.message.includes('violates foreign key constraint')) {
          console.log('🔑 Erreur de clé étrangère détectée. Vérifiez les relations avec d\'autres tables.');
        }
        
        if (insertError.message && insertError.message.includes('violates not-null constraint')) {
          console.log('❗ Contrainte NOT NULL détectée. Certains champs sont obligatoires.');
        }
        
        console.log('Détails d\'erreur:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log('✅ Insertion de test réussie!');
        console.log('Données insérées:', insertResult);
        
        // Supprimer l'entrée de test
        const { error: cleanupError } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', insertResult[0].id);
        
        if (cleanupError) {
          console.warn('⚠️ Impossible de nettoyer l\'entrée de test:', cleanupError);
        } else {
          console.log('🧹 Entrée de test supprimée.');
        }
      }
      
      return;
    }

    // Analyser la structure à partir des données
    const sample = data[0];
    const structure = {};
    
    // Déterminer le type de chaque colonne
    for (const [key, value] of Object.entries(sample)) {
      const type = value === null ? 'NULL' : typeof value;
      structure[key] = {
        type,
        value: value,
        nullable: value === null
      };
    }
    
    console.log('📊 Structure de la table déduite des données:');
    console.log(JSON.stringify(structure, null, 2));
    
    // Lister les colonnes disponibles de manière plus lisible
    console.log('\n📋 Colonnes disponibles:');
    Object.keys(sample).forEach(key => {
      console.log(`- ${key}: ${structure[key].type}`);
    });
    
    // Identifier les contraintes potentielles
    console.log('\n🔍 Tentative d\'identification des contraintes...');
    
    const { data: meta, error: metaError } = await supabase
      .from('_meta')
      .select('*')
      .eq('table', TABLE_NAME);
    
    if (metaError) {
      console.log('ℹ️ Impossible d\'accéder aux métadonnées de la table.');
    } else if (meta) {
      console.log('Métadonnées de la table:');
      console.log(meta);
    }
    
  } catch (error) {
    console.error('❌ Exception lors de l\'inspection:', error);
  }
}

// Exécuter l'inspection
inspectTable()
  .then(() => {
    console.log('\n✅ Inspection terminée');
  })
  .catch(error => {
    console.error('\n❌ Erreur non gérée:', error);
  }); 