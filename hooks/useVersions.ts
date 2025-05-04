import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";
import { Version } from "../components/client-portal/types";

export function useVersions() {
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [addingVersionForStepId, setAddingVersionForStepId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddNewVersion = (stepId: string | undefined, currentMilestone: string, deliverables: any[]) => {
    // Debug logs
    console.log("=== Données critiques pour l'ajout de version ===");
    console.log("stepId passé en paramètre:", stepId);
    console.log("currentMilestone:", currentMilestone);
    console.log("Toutes les étapes:", deliverables.map(d => ({ id: d.id, title: d.title })));
    console.log("Vérification de l'étape sélectionnée:", deliverables.find(d => d.id === currentMilestone));
    console.log("isAddVersionModalOpen avant:", isAddVersionModalOpen);
    console.log("============================================");
    
    // Utiliser le stepId passé en paramètre s'il existe, sinon utiliser currentMilestone
    const targetStepId = stepId || currentMilestone;
    
    // Vérifier que targetStepId est défini
    if (!targetStepId) {
      toast({
        title: "Erreur",
        description: "Aucune étape sélectionnée. Veuillez d'abord sélectionner une étape.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que cette étape existe bien dans la liste des étapes du projet
    const stepExists = deliverables.some(d => d.id === targetStepId);
    
    if (!stepExists) {
      toast({
        title: "Erreur",
        description: "L'étape sélectionnée n'existe pas ou n'est plus disponible.",
        variant: "destructive"
      });
      return;
    }

    console.log("Ajout d'une nouvelle version pour l'étape:", targetStepId);
    
    // Sauvegarder le stepId dans une variable d'état pour l'utiliser plus tard
    setAddingVersionForStepId(targetStepId);
    
    // Forcer un re-rendu complet du DOM avant d'afficher le modal
    document.body.style.overflow = 'hidden';
    
    // Force l'ouverture du modal sans aucun délai et sans conditions préalables
    setIsAddVersionModalOpen(true);
    
    // Double-vérification: manipuler directement le DOM si besoin
    try {
      // Forcer l'affichage du modal via le DOM
      setTimeout(() => {
        const modalElement = document.getElementById('version-modal-container');
        if (modalElement) {
          modalElement.style.display = 'flex';
          console.log("Modal forcé via DOM");
        } else {
          console.log("Élément modal non trouvé dans le DOM");
        }
      }, 50);
    } catch (err) {
      console.error("Erreur lors de la manipulation du DOM:", err);
    }
    
    console.log("isAddVersionModalOpen mis à:", true);
  };

  const submitNewVersion = async (
    data: {
      versionName: string;
      versionDescription: string;
      file: File;
    },
    project: any,
    deliverables: any[],
    currentMilestone: string,
    projectSteps: any[],
    currentUser: any,
    freelancer: any,
    refreshProjectData: () => Promise<void>
  ) => {
    try {
      console.log("=== Début de la soumission d'une nouvelle version ===");
      console.log("Données reçues:", {
        versionName: data.versionName,
        descriptionLength: data.versionDescription ? data.versionDescription.length : 0,
        fileName: data.file.name,
        fileSize: data.file.size,
        fileType: data.file.type
      });
      
      // Récupérer l'ID de l'utilisateur de manière plus robuste
      const getUserId = async () => {
        // 1. Essayer d'abord currentUser.id
        if (currentUser && currentUser.id) {
          console.log('ID utilisateur trouvé dans currentUser:', currentUser.id);
          return currentUser.id;
        }
        
        // 2. Essayer freelancer.id
        if (freelancer && freelancer.id) {
          console.log('ID utilisateur trouvé dans freelancer:', freelancer.id);
          return freelancer.id;
        }
        
        // 3. Essayer de récupérer la session directement
        try {
          console.log('Tentative de récupération de session Supabase...');
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user && session.user.id) {
            console.log('ID utilisateur trouvé dans la session:', session.user.id);
            return session.user.id;
          }
        } catch (sessionError) {
          console.error('Erreur lors de la récupération de la session:', sessionError);
        }
        
        // 4. Essayer l'ID du designer en dur
        if (process.env.NEXT_PUBLIC_DESIGNER_ID) {
          console.log('Utilisation de l\'ID designer par défaut:', process.env.NEXT_PUBLIC_DESIGNER_ID);
          return process.env.NEXT_PUBLIC_DESIGNER_ID;
        }
        
        // 5. En dernier recours, utiliser un ID par défaut
        console.log('Aucun ID trouvé, utilisation de l\'ID par défaut: 373f6a99-745f-4475-a446-b0936e27d8fe');
        return '373f6a99-745f-4475-a446-b0936e27d8fe'; // ID par défaut qui existe dans la base
      };
      
      const userId = await getUserId();
      
      // Récupérer le stepId sauvegardé lors de l'ouverture du modal
      let stepId = addingVersionForStepId;
      console.log("⭐ Utilisation directe du stepId sauvegardé:", stepId);
      
      // Si addingVersionForStepId n'est pas défini, faire les vérifications habituelles
      if (!stepId) {
        // Récupérer l'étape actuelle pour des logs détaillés
        const stepForUpload = deliverables.find(d => d.id === currentMilestone);
        console.log("Étape actuelle pour upload:", {
          id: currentMilestone,
          title: stepForUpload?.title,
          status: stepForUpload?.status
        });
        
        // Déterminons d'abord l'étape du projet à laquelle associer le nouveau livrable
        if (stepForUpload) {
          // Récupérer l'ID de l'étape associée au livrable actuel, ou l'ID du livrable lui-même si step_id n'existe pas
          stepId = stepForUpload.step_id || stepForUpload.id;
          console.log("Étape associée au livrable:", {
            current_deliverable_id: stepForUpload.id,
            step_id: stepId,
            title: stepForUpload.title
          });
        } else {
          // Rechercher une étape valide (d'abord 'current', puis 'completed', puis la première)
          const currentSteps = deliverables.filter(d => d.status === 'current');
          const completedSteps = deliverables.filter(d => d.status === 'completed');
          
          if (currentSteps.length > 0) {
            stepId = currentSteps[0].step_id || currentSteps[0].id;
            console.log("Utilisation de l'étape 'current':", {
              deliverable_id: currentSteps[0].id,
              step_id: stepId
            });
          } else if (completedSteps.length > 0) {
            stepId = completedSteps[0].step_id || completedSteps[0].id;
            console.log("Utilisation de l'étape 'completed':", {
              deliverable_id: completedSteps[0].id,
              step_id: stepId
            });
          } else if (deliverables.length > 0) {
            stepId = deliverables[0].step_id || deliverables[0].id;
            console.log("Utilisation de la première étape disponible:", {
              deliverable_id: deliverables[0].id,
              step_id: stepId
            });
          }
        }
        
        // Si aucune étape (step) n'est trouvée, essayer de récupérer une étape de la base de données
        if (!stepId) {
          console.log("⚠️ Aucun step_id trouvé, tentative de récupération depuis la base de données...");
          
          try {
            // Initialiser Supabase
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            
            // Rechercher une étape valide pour ce projet
            const { data: stepData, error: stepError } = await supabase
              .from('project_steps')
              .select('id')
              .eq('project_id', project.id)
              .limit(1);
              
            if (stepError) {
              console.error("Erreur lors de la recherche d'une étape:", stepError);
            } else if (stepData && stepData.length > 0) {
              stepId = stepData[0].id;
              console.log("✅ Étape trouvée dans la base de données:", stepId);
            }
          } catch (dbError) {
            console.error("Erreur lors de la connexion à la base de données:", dbError);
          }
        }
      }
      
      // Si toujours pas d'étape, bloquer le processus
      if (!stepId) {
        console.error("Erreur critique - project_id:", project.id);
        console.error("Étapes disponibles:", deliverables.length);
        throw new Error("Aucune étape trouvée. Impossible d'ajouter un livrable.");
      }
      
      console.log("✅ Étape identifiée pour le nouveau livrable:", stepId);
      
      // Enregistrer la nouvelle version dans la base de données
      console.log('Étape associée au nouveau livrable:', stepId);
      
      // Nous créons un nouveau livrable associé à l'étape du projet
      console.log('⚠️ Configuration pour le nouveau livrable:', {
        current_deliverable_id: 'non disponible',
        step_id: stepId,                              // L'étape du projet à laquelle associer le livrable
        // Détail des étapes disponibles pour faciliter le débogage
        project_steps: projectSteps.map(s => ({ id: s.id, title: s.title }))
      });
      
      const versionData = {
        name: data.versionName,
        description: data.versionDescription || '',
        file_url: null, // Sera rempli côté serveur
        file_name: data.file.name,
        file_type: data.file.type,
        step_id: stepId,                  // Utiliser directement l'ID de l'étape sélectionnée
        project_id: project.id,
        user_id: userId                   // Utiliser l'ID récupéré
      }
      
      console.log('Données de version complètes avec stepId spécifié:', JSON.stringify(versionData, null, 2));
      
      // Appel API pour sauvegarder la version
      // Création d'un FormData pour envoyer à la fois les métadonnées et le fichier
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('metadata', JSON.stringify(versionData));
      
      // Appel API pour créer la version et uploader le fichier en même temps
      const saveResponse = await fetch('/api/versions-upload', {
        method: 'POST',
        body: formData
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.text();
        console.error('Erreur sauvegarde version:', errorData);
        throw new Error(`Erreur lors de l'enregistrement de la version: ${errorData || 'Erreur inconnue'}`)
      }
      
      const saveResult = await saveResponse.json();
      console.log('Version sauvegardée avec succès:', saveResult);
      
      // Notification de succès
      toast({
        title: "Version ajoutée",
        description: "La nouvelle version a été ajoutée avec succès.",
      })
      
      // Rafraîchir les données du projet
      await refreshProjectData()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Error adding new version:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'ajout de la nouvelle version.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  };

  return {
    isAddVersionModalOpen,
    setIsAddVersionModalOpen,
    addingVersionForStepId,
    handleAddNewVersion,
    submitNewVersion
  };
} 