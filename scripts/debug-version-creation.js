require('dotenv').config({ path: '.env.local' });
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

// Créer une interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Récupérer les arguments de ligne de commande
const projectIdArg = process.argv[2];
const stepIdArg = process.argv[3];
const defaultName = process.argv[4] || "Test Version";
const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

// Simulation du processus de création de version
async function debugVersionCreation() {
  try {
    console.log('🔍 Diagnostic du processus de création de version\n');
    
    let selectedProject;
    let selectedStep = null;
    
    // 1. Récupération du projet
    if (projectIdArg) {
      console.log(`Utilisation de l'ID de projet fourni: ${projectIdArg}`);
      
      // Récupérer les informations du projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectIdArg)
        .single();
      
      if (projectError) {
        throw new Error(`Erreur lors de la récupération du projet: ${projectError.message}`);
      }
      
      if (!project) {
        throw new Error(`Aucun projet trouvé avec l'ID: ${projectIdArg}`);
      }
      
      selectedProject = project;
      console.log(`✅ Projet sélectionné: ${selectedProject.title} (${selectedProject.id})`);
    } else {
      // Mode interactif - sélection du projet
      console.log('Récupération des projets...');
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (projectsError) throw new Error(`Erreur lors de la récupération des projets: ${projectsError.message}`);
      
      if (!projects || projects.length === 0) {
        throw new Error('Aucun projet trouvé');
      }
      
      // Afficher les projets
      console.log('\n📋 Projets disponibles:');
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title} (${project.id})`);
      });
      
      // Sélectionner un projet
      const projectIndex = parseInt(await askQuestion('\nChoisissez un projet (numéro): ')) - 1;
      if (isNaN(projectIndex) || projectIndex < 0 || projectIndex >= projects.length) {
        throw new Error('Choix de projet invalide');
      }
      
      selectedProject = projects[projectIndex];
      console.log(`\n✅ Projet sélectionné: ${selectedProject.title} (${selectedProject.id})`);
    }
    
    // 2. Récupération de l'étape
    if (stepIdArg) {
      console.log(`\nUtilisation de l'ID d'étape fourni: ${stepIdArg}`);
      
      // Vérifier si l'étape existe pour ce projet
      const { data: step, error: stepError } = await supabase
        .from('project_steps')
        .select('id, title, status')
        .eq('id', stepIdArg)
        .single();
      
      if (stepError) {
        console.warn(`⚠️ Avertissement lors de la récupération de l'étape: ${stepError.message}`);
        console.log('Continuons sans étape (step_id sera NULL)');
      } else if (!step) {
        console.warn(`⚠️ Aucune étape trouvée avec l'ID: ${stepIdArg}`);
        console.log('Continuons sans étape (step_id sera NULL)');
      } else {
        selectedStep = step;
        console.log(`✅ Étape sélectionnée: ${selectedStep.title} (${selectedStep.id}) - Statut: ${selectedStep.status || 'N/A'}`);
      }
    } else {
      // Mode interactif - lister les étapes du projet
      console.log('\nRécupération des étapes du projet...');
      const { data: steps, error: stepsError } = await supabase
        .from('project_steps')
        .select('id, title, status')
        .eq('project_id', selectedProject.id)
        .order('order_index', { ascending: true });
      
      if (stepsError) {
        console.warn(`⚠️ Erreur lors de la récupération des étapes: ${stepsError.message}`);
        console.log('Continuons sans étape (step_id sera NULL)');
      } else if (!steps || steps.length === 0) {
        console.log('⚠️ Aucune étape trouvée pour ce projet');
        
        // Demander s'il faut continuer sans étape
        const continueWithoutStep = await askQuestion('Voulez-vous continuer sans étape? (o/n): ');
        if (continueWithoutStep.toLowerCase() !== 'o') {
          throw new Error('Opération annulée');
        }
      } else {
        // Afficher les étapes
        console.log('\n📋 Étapes disponibles:');
        steps.forEach((step, index) => {
          console.log(`${index + 1}. ${step.title} (${step.id}) - Statut: ${step.status || 'N/A'}`);
        });
        
        // Sélectionner une étape
        const stepIndex = parseInt(await askQuestion('\nChoisissez une étape (numéro): ')) - 1;
        if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
          throw new Error('Choix d\'étape invalide');
        }
        
        selectedStep = steps[stepIndex];
        console.log(`\n✅ Étape sélectionnée: ${selectedStep.title} (${selectedStep.id}) - Statut: ${selectedStep.status || 'N/A'}`);
      }
    }
    
    // 3. Simuler la création d'une version
    console.log('\n📝 Simulation de création d\'une version:');
    
    // Données de la version à créer
    let versionName, versionDescription;
    
    if (autoConfirm) {
      versionName = defaultName;
      versionDescription = "Version de test créée automatiquement";
      console.log(`Nom de la version: ${versionName}`);
      console.log(`Description: ${versionDescription}`);
    } else {
      versionName = await askQuestion(`Nom de la version [${defaultName}]: `);
      if (!versionName) versionName = defaultName;
      
      versionDescription = await askQuestion('Description (facultative): ');
    }
    
    const versionData = {
      name: versionName,
      description: versionDescription || '',
      file_url: 'https://example.com/test-file.jpg', // URL factice
      file_name: 'test-file.jpg',
      file_type: 'image/jpeg',
      project_id: selectedProject.id,
      deliverable_id: selectedStep ? selectedStep.id : null,
      user_id: '373f6a99-745f-4475-a446-b0936e27d8fe' // ID utilisateur par défaut
    };
    
    console.log('\n📄 Données de la version:');
    console.log(JSON.stringify(versionData, null, 2));
    
    // 4. Vérifier la validité du step_id
    console.log('\n🔍 Vérification de la validité du step_id:');
    
    if (versionData.deliverable_id) {
      console.log(`Deliverable ID fourni: ${versionData.deliverable_id}`);
      
      // Vérifier s'il correspond à un step_id dans project_steps
      const { data: stepCheck, error: stepCheckError } = await supabase
        .from('project_steps')
        .select('id, title')
        .eq('id', versionData.deliverable_id)
        .limit(1);
      
      if (stepCheckError) {
        console.error(`❌ Erreur lors de la vérification du step_id: ${stepCheckError.message}`);
      } else if (stepCheck && stepCheck.length > 0) {
        console.log(`✅ Le deliverable_id correspond à un step_id valide: ${stepCheck[0].title}`);
      } else {
        console.log('❌ Le deliverable_id ne correspond à aucun step_id dans project_steps');
      }
    } else {
      console.log('⚠️ Aucun deliverable_id fourni - step_id sera NULL');
    }
    
    // 5. Calculer le prochain numéro de version
    console.log('\n🔢 Calcul du prochain numéro de version:');
    
    let query = supabase
      .from('deliverables')
      .select('version_number')
      .eq('project_id', versionData.project_id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (versionData.deliverable_id) {
      query = query.eq('step_id', versionData.deliverable_id);
    } else {
      query = query.is('step_id', null);
    }
    
    const { data: existingVersions, error: versionsError } = await query;
    
    if (versionsError) {
      console.error(`❌ Erreur lors de la récupération des versions existantes: ${versionsError.message}`);
    } else {
      const nextVersionNumber = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;
      
      console.log(`✅ Prochain numéro de version: ${nextVersionNumber}`);
      
      if (existingVersions && existingVersions.length > 0) {
        console.log(`Basé sur la dernière version trouvée: ${existingVersions[0].version_number}`);
      } else {
        console.log('Aucune version existante trouvée, première version');
      }
    }
    
    // 6. Simuler l'insertion de la version
    console.log('\n🧪 Simulation de l\'insertion:');
    
    let confirmation = 'n';
    if (autoConfirm) {
      confirmation = 'o';
      console.log('Confirmation automatique activée (--yes)');
    } else {
      confirmation = await askQuestion('Voulez-vous réellement créer cette version dans la base de données? (o/n): ');
    }
    
    if (confirmation.toLowerCase() === 'o') {
      // Préparation des données à insérer
      let nextVersionNumber = 1;
      
      if (existingVersions && existingVersions.length > 0) {
        nextVersionNumber = existingVersions[0].version_number + 1;
      }
      
      const deliverableRecord = {
        project_id: versionData.project_id,
        step_id: versionData.deliverable_id,
        title: versionData.name,
        description: versionData.description || '',
        file_url: versionData.file_url,
        file_type: versionData.file_type,
        file_name: versionData.file_name,
        preview_url: versionData.file_url,
        version_name: versionData.name,
        version_number: nextVersionNumber,
        is_latest: true,
        status: 'pending',
        created_by: versionData.user_id
      };
      
      console.log('Tentative d\'insertion...');
      
      // Insérer la version
      const { data: insertedData, error: insertError } = await supabase
        .from('deliverables')
        .insert([deliverableRecord])
        .select();
      
      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError);
        console.log('Détails:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log('✅ Version créée avec succès:', insertedData[0].id);
        
        // Mettre à jour les autres versions
        if (versionData.deliverable_id) {
          console.log('Mise à jour des autres versions (is_latest = false)...');
          
          const { error: updateError } = await supabase
            .from('deliverables')
            .update({ is_latest: false })
            .eq('step_id', versionData.deliverable_id)
            .eq('project_id', versionData.project_id)
            .neq('id', insertedData[0].id);
          
          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour des autres versions:', updateError);
          } else {
            console.log('✅ Autres versions mises à jour avec succès');
          }
        }
      }
    } else {
      console.log('Insertion annulée - simulation uniquement');
    }
    
    console.log('\n✅ Diagnostic terminé');
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Afficher l'aide si demandé
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node ${process.argv[1]} [project_id] [step_id] [version_name] [options]

Arguments:
  project_id    ID du projet à utiliser (optionnel)
  step_id       ID de l'étape à utiliser (optionnel)
  version_name  Nom de la version (optionnel, défaut: "Test Version")

Options:
  --yes, -y     Confirmer automatiquement la création
  --help, -h    Afficher cette aide

Exemples:
  node ${process.argv[1]}                                              # Mode interactif complet
  node ${process.argv[1]} 550e8400-e29b-41d4-a716-446655440020         # Spécifier un projet
  node ${process.argv[1]} 550e8400-e29b-41d4-a716-446655440020 abc6f706-e809-46f7-baea-bd48769bd796  # Spécifier projet et étape
  node ${process.argv[1]} 550e8400-e29b-41d4-a716-446655440020 abc6f706-e809-46f7-baea-bd48769bd796 "Ma version" --yes  # Création automatique
  `);
  process.exit(0);
}

// Exécuter le diagnostic
debugVersionCreation(); 