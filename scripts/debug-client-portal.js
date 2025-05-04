// Script pour déboguer l'ajout de version dans le client portal
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Récupérer les variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

// Client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  try {
    console.log('=== Débogage ajout de version dans le client portal ===');
    
    // Paramètres pour le test (basés sur les données réelles)
    const projectId = '550e8400-e29b-41d4-a716-446655440020';
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    
    // 1. Récupérer les étapes du projet
    console.log(`\n1. Récupération des étapes pour le projet ${projectId}...`);
    const { data: steps, error: stepsError } = await supabase
      .from('project_steps')
      .select('*')
      .eq('project_id', projectId);
    
    if (stepsError) {
      console.error('Erreur:', stepsError);
      return;
    }
    
    if (!steps || steps.length === 0) {
      console.log('Aucune étape trouvée pour ce projet');
      return;
    }
    
    console.log(`${steps.length} étapes trouvées:`);
    steps.forEach((step, index) => {
      console.log(`${index + 1}. ID: ${step.id}, Titre: ${step.title}, Status: ${step.status}`);
    });
    
    // Utiliser la première étape avec statut "current" ou la première étape
    const currentStep = steps.find(step => step.status === 'current') || steps[0];
    console.log(`\nÉtape sélectionnée: ${currentStep.title} (ID: ${currentStep.id})`);
    
    // 2. Simuler l'ajout d'une version à cette étape
    console.log('\n2. Simulation d\'ajout d\'une version...');
    
    const versionData = {
      name: 'Version de test debug',
      description: 'Version créée par le script de débogage',
      file_url: 'https://example.com/sample.jpg',
      file_name: 'sample.jpg',
      file_type: 'image/jpeg',
      step_id: currentStep.id,  // Utiliser l'ID de l'étape directement
      project_id: projectId,
      user_id: userId
    };
    
    console.log('Données de version:', JSON.stringify(versionData, null, 2));
    
    // 3. Appeler l'API directement avec les mêmes données
    console.log('\n3. Insertion directe dans la table deliverables...');
    
    // Préparer la donnée à insérer
    const deliverableRecord = {
      project_id: versionData.project_id,
      step_id: versionData.step_id,
      title: versionData.name,
      description: versionData.description,
      file_url: versionData.file_url,
      file_type: versionData.file_type,
      file_name: versionData.file_name,
      preview_url: versionData.file_url,
      version_name: versionData.name,
      version_number: 1, // Simplifié pour le test
      is_latest: true,
      status: 'pending',
      created_by: versionData.user_id
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('deliverables')
      .insert([deliverableRecord])
      .select();
    
    if (insertError) {
      console.error('Erreur lors de l\'insertion:', insertError);
      return;
    }
    
    console.log('Insertion réussie:', insertedData);
    
  } catch (error) {
    console.error('Erreur non gérée:', error);
  }
}

main(); 