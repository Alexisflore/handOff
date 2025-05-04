import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vérification des variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variables d\'environnement Supabase manquantes:', {
    url: !!SUPABASE_URL,
    key: !!SUPABASE_KEY
  });
}

// Initialiser le client Supabase
const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Vérifier si Supabase est correctement initialisé
    if (!supabase) {
      console.error('Client Supabase non initialisé');
      return NextResponse.json(
        { error: 'Erreur de configuration serveur (Supabase)' },
        { status: 500 }
      );
    }

    // Récupérer les données de la version depuis le corps de la requête
    const versionData = await request.json();
    
    // Journaliser les données reçues pour le débogage
    console.log('Données de version reçues:', JSON.stringify(versionData, null, 2));
    
    // ID par défaut à utiliser si aucun ID utilisateur n'est fourni
    const DEFAULT_USER_ID = '373f6a99-745f-4475-a446-b0936e27d8fe'; // ID d'un utilisateur qui existe
    
    // S'assurer que user_id est présent
    if (!versionData.user_id) {
      console.log('⚠️ Aucun user_id fourni, utilisation de l\'ID par défaut:', DEFAULT_USER_ID);
      versionData.user_id = DEFAULT_USER_ID;
    } else {
      console.log('✅ user_id fourni:', versionData.user_id);
    }
    
    // Valider les données
    if (!versionData.name || !versionData.file_url || !versionData.project_id) {
      console.log('Données incomplètes:', { 
        name: !!versionData.name, 
        file_url: !!versionData.file_url, 
        project_id: !!versionData.project_id 
      });
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }
    
    // Test de connexion à Supabase
    console.log('Test de connexion Supabase...');
    const { data: testData, error: testError } = await supabase.from('deliverables').select('id').limit(1);
    
    if (testError) {
      console.error('Erreur lors du test de connexion Supabase:', testError);
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données', details: testError },
        { status: 500 }
      );
    }
    
    console.log('Connexion Supabase OK, test retourné:', testData);
    
    // Récupérer et valider le step_id 
    let validStepId = null;
    
    // Récupérer le nom du projet pour le débogage
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('id', versionData.project_id)
      .limit(1);
      
    if (projectError) {
      console.error('Erreur lors de la récupération du projet:', projectError);
    } else if (projectData && projectData.length > 0) {
      console.log('✅ Projet identifié:', {
        id: projectData[0].id,
        name: projectData[0].name,
        client_id: projectData[0].client_id
      });
    } else {
      console.log('❌ Projet non trouvé avec ID:', versionData.project_id);
    }
    
    // Log toutes les étapes disponibles pour ce projet
    const { data: allSteps, error: allStepsError } = await supabase
      .from('project_steps')
      .select('id, title, status, project_id')
      .eq('project_id', versionData.project_id);
      
    if (allStepsError) {
      console.error('Erreur lors de la récupération de toutes les étapes:', allStepsError);
    } else {
      console.log(`✅ Étapes disponibles pour le projet (${allSteps.length}):`, 
        allSteps.map(s => ({ id: s.id, title: s.title, status: s.status }))
      );
    }
    
    // Vérifier d'abord si step_id est directement fourni
    if (versionData.step_id) {
      console.log('Step ID directement fourni:', versionData.step_id);
      
      // Vérifier si ce step_id existe dans project_steps
      const { data: stepData, error: stepError } = await supabase
        .from('project_steps')
        .select('id, title, project_id')
        .eq('id', versionData.step_id)
        .eq('project_id', versionData.project_id)
        .limit(1);
      
      if (stepError) {
        console.error('Erreur lors de la vérification du step_id:', stepError);
      } else if (stepData && stepData.length > 0) {
        // Le step_id est valide
        validStepId = versionData.step_id;
        console.log('step_id validé:', validStepId, '(', stepData[0].title, ')');
      } else {
        console.warn('Le step_id fourni n\'existe pas dans la table project_steps:', versionData.step_id);
        
        // Vérifier si le step_id correspond à une étape d'un autre projet
        const { data: otherStepData } = await supabase
          .from('project_steps')
          .select('id, title, project_id')
          .eq('id', versionData.step_id);
          
        if (otherStepData && otherStepData.length > 0) {
          console.error('⚠️ Le step_id existe mais pour un autre projet:', {
            step_id: versionData.step_id,
            found_project_id: otherStepData[0].project_id,
            current_project_id: versionData.project_id
          });
        }
      }
    } 
    // Vérifier si deliverable_id est fourni comme fallback
    else if (versionData.deliverable_id) {
      console.log('Deliverable ID fourni comme fallback:', versionData.deliverable_id);
      
      // Vérifier si ce deliverable_id correspond à un step_id dans project_steps
      const { data: stepData, error: stepError } = await supabase
        .from('project_steps')
        .select('id, title, project_id')
        .eq('id', versionData.deliverable_id)
        .eq('project_id', versionData.project_id)
        .limit(1);
      
      if (stepError) {
        console.error('Erreur lors de la vérification du deliverable_id:', stepError);
      } else if (stepData && stepData.length > 0) {
        // Le deliverable_id correspond à un step_id valide
        validStepId = versionData.deliverable_id;
        console.log('deliverable_id validé comme step_id:', validStepId, '(', stepData[0].title, ')');
      } else {
        console.warn('Le deliverable_id fourni ne correspond pas à un step_id valide');
      }
    } else {
      console.warn('Ni step_id ni deliverable_id fourni - step_id sera NULL');
    }
    
    // Obtenir le prochain numéro de version pour ce livrable
    let nextVersionNumber = 1;
    
    if (validStepId) {
      // Chercher le dernier numéro de version pour ce step_id
      const { data: existingVersions, error: countError } = await supabase
        .from('deliverables')
        .select('version_number')
        .eq('project_id', versionData.project_id)
        .eq('step_id', validStepId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      if (!countError && existingVersions && existingVersions.length > 0) {
        const latestVersionNumber = existingVersions[0].version_number;
        nextVersionNumber = latestVersionNumber + 1;
        console.log(`Dernière version trouvée: ${latestVersionNumber}, prochaine version: ${nextVersionNumber}`);
      } else {
        console.log(`Aucune version existante trouvée, première version: ${nextVersionNumber}`);
      }
    } else {
      // Si on n'a pas de step_id valide, juste commencer à 1
      console.log(`Pas de step_id valide, première version: ${nextVersionNumber}`);
    }
    
    // Préparation des données à insérer 
    // En utilisant les colonnes de la table deliverables
    const deliverableRecord = {
      project_id: versionData.project_id,
      step_id: validStepId,
      title: versionData.name,
      description: versionData.description || '',
      file_url: versionData.file_url,
      file_type: versionData.file_type || null,
      file_name: versionData.file_name || null,
      preview_url: versionData.file_url, // On utilise la même URL pour l'aperçu
      version_name: versionData.name,
      version_number: nextVersionNumber,
      is_latest: true,
      status: 'pending', // Statut initial (peut être 'pending', 'approved', 'rejected')
      created_by: versionData.user_id, // L'ID utilisateur est maintenant garanti d'être présent
      // Indique si c'est un nouveau livrable pour pouvoir le traiter spécifiquement si nécessaire
    };
    
    console.log('Insertion de version dans deliverables...', deliverableRecord);
    
    // Insérer la nouvelle version dans la table deliverables
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .insert([deliverableRecord])
        .select();
      
      if (error) {
        console.error('Erreur détaillée lors de l\'insertion:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return NextResponse.json(
          { error: 'Échec de l\'enregistrement de la version', details: error },
          { status: 500 }
        );
      }
      
      console.log('Version insérée avec succès dans deliverables:', data);
      
      // Mettre à jour les autres versions pour qu'elles ne soient plus les dernières
      if (data && data.length > 0 && validStepId) {
        try {
          const { error: updateError } = await supabase
            .from('deliverables')
            .update({ is_latest: false })
            .eq('step_id', validStepId)
            .eq('project_id', versionData.project_id)
            .neq('id', data[0].id);
          
          if (updateError) {
            console.error('Erreur lors de la mise à jour des autres versions:', updateError);
          } else {
            console.log('Autres versions mises à jour avec succès');
          }
        } catch (updateException) {
          console.error('Exception lors de la mise à jour des autres versions:', updateException);
        }
      }
      
      // Retourner la version créée
      return NextResponse.json({ success: true, data });
    } catch (insertError) {
      console.error('Exception lors de l\'insertion:', insertError);
      return NextResponse.json(
        { error: 'Exception lors de l\'insertion', details: String(insertError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur globale lors de la création de la version:', error);
    return NextResponse.json(
      { error: 'Échec de la création de la version', details: String(error) },
      { status: 500 }
    );
  }
} 