require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Créer une interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question et obtenir une réponse
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createStep() {
  try {
    console.log('🚀 Création d\'une nouvelle étape de projet\n');
    
    // 1. Lister les projets disponibles
    console.log('Récupération des projets...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description')
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      throw new Error(`Erreur lors de la récupération des projets: ${projectsError.message}`);
    }
    
    if (!projects || projects.length === 0) {
      throw new Error('Aucun projet trouvé dans la base de données');
    }
    
    // Afficher les projets disponibles
    console.log('\n📋 Projets disponibles:');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.id})`);
    });
    
    // 2. Demander à l'utilisateur de choisir un projet
    const projectChoice = parseInt(await askQuestion('\nChoisissez un projet (numéro): '));
    if (isNaN(projectChoice) || projectChoice < 1 || projectChoice > projects.length) {
      throw new Error('Choix de projet invalide');
    }
    
    const selectedProject = projects[projectChoice - 1];
    console.log(`\nProjet sélectionné: ${selectedProject.name} (${selectedProject.id})`);
    
    // 3. Vérifier les étapes existantes pour ce projet
    const { data: existingSteps, error: stepsError } = await supabase
      .from('project_steps')
      .select('id, title, status')
      .eq('project_id', selectedProject.id)
      .order('created_at', { ascending: true });
    
    if (stepsError) {
      throw new Error(`Erreur lors de la récupération des étapes: ${stepsError.message}`);
    }
    
    console.log('\n📋 Étapes existantes:');
    if (existingSteps && existingSteps.length > 0) {
      existingSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.title} (statut: ${step.status})`);
      });
    } else {
      console.log('Aucune étape existante pour ce projet');
    }
    
    // 4. Récupérer les informations pour la nouvelle étape
    console.log('\n📝 Informations pour la nouvelle étape:');
    const stepTitle = await askQuestion('Titre de l\'étape: ');
    const stepDescription = await askQuestion('Description (facultative): ');
    
    // Choix du statut
    console.log('\nStatuts disponibles:');
    console.log('1. upcoming (à venir)');
    console.log('2. current (en cours)');
    console.log('3. completed (terminé)');
    
    const statusChoice = parseInt(await askQuestion('\nChoisissez un statut (numéro): '));
    let status;
    
    switch (statusChoice) {
      case 1:
        status = 'upcoming';
        break;
      case 2:
        status = 'current';
        break;
      case 3:
        status = 'completed';
        break;
      default:
        status = 'upcoming';
    }
    
    // 5. Confirmer les informations
    console.log('\n🔍 Récapitulatif:');
    console.log(`Projet: ${selectedProject.name}`);
    console.log(`Titre: ${stepTitle}`);
    console.log(`Description: ${stepDescription || '(aucune)'}`);
    console.log(`Statut: ${status}`);
    
    const confirmation = await askQuestion('\nConfirmer la création ? (o/n): ');
    if (confirmation.toLowerCase() !== 'o' && confirmation.toLowerCase() !== 'oui') {
      console.log('Opération annulée');
      rl.close();
      return;
    }
    
    // 6. Créer la nouvelle étape
    const newStep = {
      project_id: selectedProject.id,
      title: stepTitle,
      description: stepDescription || null,
      status: status,
      created_at: new Date().toISOString()
    };
    
    const { data: createdStep, error: createError } = await supabase
      .from('project_steps')
      .insert([newStep])
      .select();
    
    if (createError) {
      throw new Error(`Erreur lors de la création de l'étape: ${createError.message}`);
    }
    
    console.log('\n✅ Étape créée avec succès!');
    console.log(`ID de l'étape: ${createdStep[0].id}`);
    
    // 7. Mettre à jour le statut des autres étapes si nécessaire
    if (status === 'current') {
      // Si la nouvelle étape est 'current', mettre à jour les autres étapes 'current' en 'upcoming'
      console.log('\nMise à jour des autres étapes...');
      
      const { error: updateError } = await supabase
        .from('project_steps')
        .update({ status: 'upcoming' })
        .eq('project_id', selectedProject.id)
        .eq('status', 'current')
        .neq('id', createdStep[0].id);
      
      if (updateError) {
        console.error(`Avertissement: Erreur lors de la mise à jour des autres étapes: ${updateError.message}`);
      } else {
        console.log('Autres étapes mises à jour avec succès');
      }
    }
    
    // 8. Vérifier la structure complète après la création
    console.log('\n🔍 Vérification de la structure après création:');
    
    const { data: updatedSteps, error: checkError } = await supabase
      .from('project_steps')
      .select('id, title, status')
      .eq('project_id', selectedProject.id)
      .order('created_at', { ascending: true });
    
    if (checkError) {
      console.error(`Erreur lors de la vérification: ${checkError.message}`);
    } else {
      console.log('Étapes du projet après création:');
      updatedSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.title} (statut: ${step.status})`);
      });
    }
    
    console.log('\n📋 Instructions pour utiliser cette étape:');
    console.log('1. L\'étape est maintenant disponible dans le DeliverableSelector');
    console.log('2. Pour ajouter des livrables à cette étape:');
    console.log('   - Sélectionnez cette étape dans le DeliverableSelector');
    console.log('   - Utilisez le bouton "Ajouter une version" pour créer un nouveau livrable');
    console.log(`3. Référence technique: utilisez l'ID "${createdStep[0].id}" comme "step_id" ou "deliverable_id" dans l'API`);
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Exécuter la fonction
createStep(); 