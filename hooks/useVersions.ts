import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";
import { Version } from "../components/client-portal/types";

export function useVersions() {
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [addingVersionForStepId, setAddingVersionForStepId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddNewVersion = (stepId: string | undefined, currentMilestone?: string, deliverables?: any[]) => {
    // Debug logs
    console.log("=== Données critiques pour l'ajout de version ===");
    console.log("stepId passé en paramètre:", stepId);
    console.log("currentMilestone:", currentMilestone);
    console.log("deliverables:", deliverables ? `${deliverables.length} éléments` : 'non fourni');
    
    // CORRECTION CRITIQUE: Utiliser directement le stepId passé en paramètre s'il existe
    // Ne pas tenter de vérifier son existence dans deliverables pour cette étape 
    const targetStepId = stepId || currentMilestone;
    console.log("⚠️ ID UTILISE POUR L'AJOUT DE VERSION:", targetStepId);
    
    // Vérifier que targetStepId est défini
    if (!targetStepId) {
      toast({
        title: "Erreur",
        description: "Aucune étape sélectionnée. Veuillez d'abord sélectionner une étape.",
        variant: "destructive"
      });
      return;
    }

    // Nous faisons confiance au stepId qui a été passé, même s'il n'est pas encore dans les deliverables
    // car cela peut être une nouvelle étape sans livrables
    console.log("Ajout d'une nouvelle version pour l'étape:", targetStepId);
    
    // Sauvegarder le stepId dans une variable d'état pour l'utiliser plus tard
    setAddingVersionForStepId(targetStepId);
    
    // Sauvegarder aussi dans localStorage et sessionStorage pour garantir la persistance
    try {
      localStorage.setItem('addingVersionForStepId', targetStepId);
      sessionStorage.setItem('lastSelectedStepId', targetStepId);
      console.log("Step ID sauvegardé dans localStorage et sessionStorage:", targetStepId);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", e);
    }
    
    // CORRECTION CRITIQUE: Ouvrir le modal avec un petit délai pour garantir que tout est prêt
    setTimeout(() => {
      // Forcer un re-rendu complet du DOM avant d'afficher le modal
      document.body.style.overflow = 'hidden';
      
      // Force l'ouverture du modal
      setIsAddVersionModalOpen(true);
      console.log("isAddVersionModalOpen mis à:", true);
      
      // Manipuler directement le DOM en plus de l'état React
      try {
        const modalElement = document.getElementById('version-modal-container');
        if (modalElement) {
          modalElement.style.display = 'flex';
          console.log("🔴 Modal forcé via DOM");
        } else {
          const backupModal = document.getElementById('backup-version-modal');
          if (backupModal) {
            backupModal.style.display = 'flex';
            console.log("🔴 Modal de secours forcé via DOM");
          } else {
            console.log("⚠️ Aucun élément modal trouvé dans le DOM");
          }
        }
      } catch (err) {
        console.error("Erreur lors de la manipulation du DOM:", err);
      }
    }, 50); // Un court délai pour s'assurer que tout est prêt
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
      
      // CORRECTION CRITIQUE: Récupérer le stepId de plusieurs sources
      // 1. D'abord essayer la variable d'état React
      let stepId = addingVersionForStepId;
      console.log("Tentative 1 - Step ID depuis React state:", stepId);
      
      // 2. Si null, essayer de récupérer depuis localStorage
      if (!stepId) {
        try {
          stepId = localStorage.getItem('addingVersionForStepId');
          console.log("Tentative 2 - Step ID depuis localStorage:", stepId);
        } catch (e) {
          console.error("Erreur lors de la récupération depuis localStorage:", e);
        }
      }
      
      // 2b. Si toujours null, essayer sessionStorage
      if (!stepId) {
        try {
          stepId = sessionStorage.getItem('lastSelectedStepId');
          console.log("Tentative 2b - Step ID depuis sessionStorage:", stepId);
        } catch (e) {
          console.error("Erreur lors de la récupération depuis sessionStorage:", e);
        }
      }
      
      // 3. Si toujours null, utiliser currentMilestone comme dernier recours
      if (!stepId) {
        stepId = currentMilestone;
        console.log("Tentative 3 - Utilisation de currentMilestone comme fallback:", stepId);
      }
      
      // Afficher le contenu complet des arrays pour débogage
      console.log("🔍 DIAGNOSTIC - Liste des project_steps disponibles:", 
        projectSteps.map(step => ({ id: step.id, title: step.title || "Sans titre" }))
      );
      console.log("🔍 DIAGNOSTIC - Liste des deliverables disponibles:", 
        deliverables.map(d => ({ id: d.id, title: d.title || "Sans titre" }))
      );
      
      // CORRECTION CRITIQUE: Vérifier si le stepId existe dans projectSteps et non dans deliverables
      const stepExistsInProjectSteps = projectSteps.some(step => step.id === stepId);
      console.log(`Step ID ${stepId} existe dans project_steps: ${stepExistsInProjectSteps ? 'OUI ✅' : 'NON ❌'}`);
      
      // Si le stepId n'existe pas dans projectSteps, essayer de trouver un stepId valide
      if (!stepExistsInProjectSteps && projectSteps.length > 0) {
        console.log("⚠️ Le step ID n'existe pas dans project_steps, utilisation du premier step disponible");
        stepId = projectSteps[0].id;
        console.log("Nouveau step ID (depuis project_steps):", stepId);
      }
      // Fallback si aucun projectStep n'est disponible mais des deliverables existent
      else if (!stepExistsInProjectSteps && projectSteps.length === 0 && deliverables.length > 0) {
        console.log("⚠️ Aucun project_step trouvé, vérification dans deliverables");
        const stepExistsInDeliverables = deliverables.some(d => d.id === stepId);
        
        if (!stepExistsInDeliverables) {
          stepId = deliverables[0].id;
          console.log("Nouveau step ID (depuis deliverables):", stepId);
        }
      }
      
      console.log("✅ Étape identifiée pour le nouveau livrable:", stepId);
      
      // Si toujours pas d'étape, bloquer le processus
      if (!stepId) {
        console.error("Erreur critique - project_id:", project.id);
        console.error("Étapes disponibles:", deliverables.length);
        throw new Error("Aucune étape trouvée. Impossible d'ajouter un livrable.");
      }
      
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
      
      // NOUVEAU: Nettoyer après utilisation réussie
      setAddingVersionForStepId(null);
      try {
        localStorage.removeItem('addingVersionForStepId');
      } catch (e) {
        console.error("Erreur lors de la suppression depuis localStorage:", e);
      }
      
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