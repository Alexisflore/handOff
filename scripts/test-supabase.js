// Script pour tester la connexion à Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Vérifier les variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('Variables d\'environnement:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Défini' : '❌ Non défini');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Non défini');
console.log('- SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Défini' : '❌ Non défini');

// Vérifier si les variables essentielles sont définies
if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY)) {
  console.error('❌ Variables d\'environnement manquantes. Veuillez vérifier votre fichier .env.local');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
);

console.log('\nTest de connexion Supabase...');

// Tester la connexion
async function testConnection() {
  try {
    // Test d'accès à la base de données
    console.log('- Test d\'accès à la table deliverables...');
    const { data, error } = await supabase.from('deliverables').select('id').limit(1);

    if (error) {
      console.error('❌ Erreur d\'accès à la table deliverables:', error);
      return false;
    }

    console.log('✅ Connexion à la base de données réussie');
    console.log('- Données récupérées:', data);

    // Découvrir les colonnes disponibles
    console.log('\n- Récupération de la structure de la table deliverables...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('deliverables')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Erreur lors de la récupération de la structure:', sampleError);
    } else {
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Structure de la table:');
        const columns = Object.keys(sampleData[0]);
        console.log('Colonnes disponibles:', columns);
      } else {
        console.log('ℹ️ Aucune donnée pour déterminer la structure');
      }
    }

    // Récupérer les étapes du projet testé
    console.log('\n- Récupération des étapes du projet (project_steps)...');
    // Utilisons l'ID de projet qui apparaît dans les logs
    const projectId = '550e8400-e29b-41d4-a716-446655440020';
    
    const { data: stepsData, error: stepsError } = await supabase
      .from('project_steps')
      .select('*')
      .eq('project_id', projectId);
    
    if (stepsError) {
      console.error('❌ Erreur lors de la récupération des steps:', stepsError);
    } else {
      if (stepsData && stepsData.length > 0) {
        console.log(`✅ ${stepsData.length} étapes trouvées pour le projet:`);
        stepsData.forEach(step => {
          console.log(`- ID: ${step.id}, Titre: ${step.title}, Status: ${step.status}`);
        });
      } else {
        console.log('⚠️ Aucune étape trouvée pour ce projet!');
      }
    }

    // Test d'insertion
    console.log('\n- Test d\'insertion...');
    const testRecord = {
      title: 'TEST_' + Date.now(),
      description: 'Test record - à supprimer',
      file_url: 'https://example.com/test.jpg',
      file_name: 'test.jpg',
      file_type: 'image/jpeg',
      step_id: 'test-step-id',  // Assurez-vous que cette valeur est valide
      project_id: 'test-project-id', // Assurez-vous que cette valeur est valide
      version_name: 'Test Version',
      is_latest: true,
      status: 'completed'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('deliverables')
      .insert([testRecord])
      .select();

    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      console.log('Détails supplémentaires:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Si l'erreur est liée à des contraintes de clé étrangère
      if (insertError.message && insertError.message.includes('foreign key constraint')) {
        console.log('⚠️ Erreur de clé étrangère. Vérifiez que project_id et step_id existent dans leurs tables respectives.');
        
        // Essayons de récupérer des valeurs valides pour les clés étrangères
        console.log('\n- Recherche de valeurs valides...');
        
        const { data: projectData } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
          
        const { data: stepData } = await supabase
          .from('steps')
          .select('id')
          .limit(1);
          
        console.log('ID de projet valide possible:', projectData && projectData.length > 0 ? projectData[0].id : 'Non trouvé');
        console.log('ID d\'étape valide possible:', stepData && stepData.length > 0 ? stepData[0].id : 'Non trouvé');
      }
      
      return false;
    }

    console.log('✅ Insertion réussie');
    console.log('- Données insérées:', insertData);

    // Tentative de suppression du test
    if (insertData && insertData.length > 0) {
      const { error: deleteError } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.warn('⚠️ Impossible de supprimer l\'enregistrement de test:', deleteError);
      } else {
        console.log('✅ Enregistrement de test supprimé');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Exception lors du test:', error);
    return false;
  }
}

// Exécuter le test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Test de connexion Supabase réussi!');
    } else {
      console.error('\n❌ Test de connexion Supabase échoué');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Exception non gérée:', error);
    process.exit(1);
  }); 