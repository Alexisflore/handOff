require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
  console.log('🔍 Analyse de la structure de la base de données...\n');
  
  try {
    // 1. Analyser la table projects
    console.log('📊 PROJETS');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) throw projectsError;
    
    console.log(`Nombre de projets (échantillon): ${projects.length}`);
    if (projects.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(projects[0]));
      console.log('Structure d\'un projet:', JSON.stringify(projects[0], null, 2));
    }
    
    // 2. Analyser la table project_steps
    console.log('\n📋 ÉTAPES DE PROJET (project_steps)');
    const { data: steps, error: stepsError } = await supabase
      .from('project_steps')
      .select('*')
      .limit(5);
    
    if (stepsError) throw stepsError;
    
    console.log(`Nombre d'étapes (échantillon): ${steps.length}`);
    if (steps.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(steps[0]));
      console.log('Structure d\'une étape:', JSON.stringify(steps[0], null, 2));
    }
    
    // 3. Analyser la table deliverables
    console.log('\n📦 LIVRABLES (deliverables)');
    const { data: deliverables, error: deliverablesError } = await supabase
      .from('deliverables')
      .select('*')
      .limit(5);
    
    if (deliverablesError) throw deliverablesError;
    
    console.log(`Nombre de livrables (échantillon): ${deliverables.length}`);
    if (deliverables.length > 0) {
      console.log('Colonnes disponibles:', Object.keys(deliverables[0]));
      console.log('Structure d\'un livrable:', JSON.stringify(deliverables[0], null, 2));
    }
    
    // 4. Analyser la relation hiérarchique entre un projet spécifique
    if (projects.length > 0) {
      const projectId = projects[0].id;
      console.log(`\n🔍 ANALYSE DÉTAILLÉE DU PROJET: ${projects[0].id}`);
      
      // Récupérer toutes les étapes de ce projet
      const { data: projectSteps, error: projectStepsError } = await supabase
        .from('project_steps')
        .select('*')
        .eq('project_id', projectId);
      
      if (projectStepsError) throw projectStepsError;
      
      console.log(`Nombre d'étapes pour ce projet: ${projectSteps.length}`);
      
      // Pour chaque étape, récupérer les livrables associés
      for (const step of projectSteps) {
        const { data: stepDeliverables, error: stepDeliverablesError } = await supabase
          .from('deliverables')
          .select('*')
          .eq('step_id', step.id)
          .eq('project_id', projectId);
        
        if (stepDeliverablesError) throw stepDeliverablesError;
        
        console.log(`\n  Étape: ${step.title || step.id} (${step.id})`);
        console.log(`  Statut: ${step.status || 'N/A'}`);
        console.log(`  Nombre de versions: ${stepDeliverables.length}`);
        
        if (stepDeliverables.length > 0) {
          console.log('  Versions:');
          stepDeliverables.forEach(deliverable => {
            console.log(`    - Version ${deliverable.version_number || 'N/A'}: "${deliverable.title || 'Sans titre'}" (${deliverable.is_latest ? 'LATEST' : 'ancien'}, statut: ${deliverable.status || 'N/A'})`);
          });
        }
      }
    }
    
    // 5. Statistiques générales
    console.log('\n📈 STATISTIQUES GÉNÉRALES');
    
    // Compter le nombre total de projets
    const { count: projectsCount, error: projectsCountError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectsCountError) throw projectsCountError;
    
    // Compter le nombre total d'étapes
    const { count: stepsCount, error: stepsCountError } = await supabase
      .from('project_steps')
      .select('*', { count: 'exact', head: true });
    
    if (stepsCountError) throw stepsCountError;
    
    // Compter le nombre total de livrables
    const { count: deliverablesCount, error: deliverablesCountError } = await supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true });
    
    if (deliverablesCountError) throw deliverablesCountError;
    
    console.log(`Nombre total de projets: ${projectsCount}`);
    console.log(`Nombre total d'étapes: ${stepsCount}`);
    console.log(`Nombre total de livrables: ${deliverablesCount}`);
    
    if (stepsCount > 0) {
      console.log(`Moyenne d'étapes par projet: ${(stepsCount / projectsCount).toFixed(2)}`);
    }
    
    if (deliverablesCount > 0) {
      console.log(`Moyenne de livrables par étape: ${(deliverablesCount / stepsCount).toFixed(2)}`);
    }
    
    console.log('\n✅ Analyse terminée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
analyzeDatabase()
  .catch(console.error)
  .finally(() => {
    console.log('Script terminé');
  }); 