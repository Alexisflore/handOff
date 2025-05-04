import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { TabType } from "@/app/projects/[id]/page";
import { Deliverable, Version } from "../components/client-portal/types";

export function useDeliverables(
  deliverables: Deliverable[], 
  projectSteps: any[]
) {
  const [currentMilestone, setCurrentMilestone] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("current" as TabType);
  const [isDeliverableSelectorOpen, setIsDeliverableSelectorOpen] = useState(true);
  const { toast } = useToast();

  // Initialisation avec le livrable courant
  useEffect(() => {
    // Trouver le livrable actuel (status = 'current')
    const currentDeliverableObj = deliverables.find((d) => d.status === "current") || deliverables[0] || null;
    
    if (currentDeliverableObj) {
      setCurrentMilestone(currentDeliverableObj.id || "");
      if (currentDeliverableObj.versions && currentDeliverableObj.versions.length > 0) {
        setCurrentVersion(currentDeliverableObj.versions[0].id);
      }
    }
  }, [deliverables]);

  // Trouver le livrable actif
  const activeDeliverable = useMemo(() => {
    return deliverables.find((d) => d.id === currentMilestone) || deliverables[0] || null;
  }, [deliverables, currentMilestone]);
  
  // Obtenir tous les livrables associés à l'étape actuelle
  const stepDeliverables = useMemo(() => {
    // Si on a sélectionné un step
    const currentStep = projectSteps.find(s => s.id === currentMilestone);
    
    if (currentStep) {
      // Filtrer tous les livrables associés à cette étape
      const relatedDeliverables = deliverables.filter(d => 
        (d.step_id && d.step_id === currentStep.id) || d.id === currentStep.id
      );
      
      console.log("Livrables associés à l'étape:", relatedDeliverables.map(d => ({ 
        id: d.id, 
        title: d.title, 
        versions: d.versions?.length || 0
      })));
      
      return relatedDeliverables;
    }
    
    // Si on a sélectionné un livrable directement, retourner juste celui-là
    if (activeDeliverable) {
      return [activeDeliverable];
    }
    
    return [];
  }, [currentMilestone, projectSteps, deliverables, activeDeliverable]);
  
  // Obtenir toutes les versions de tous les livrables associés à l'étape
  const allStepVersions = useMemo(() => {
    let allVersions: Version[] = [];
    
    stepDeliverables.forEach(deliverable => {
      if (deliverable.versions && deliverable.versions.length > 0) {
        // Ajouter le nom du livrable à chaque version pour l'affichage
        const versionsWithDeliverableName = deliverable.versions.map((version: Version) => ({
          ...version,
          deliverable_title: deliverable.title
        }));
        
        allVersions = [...allVersions, ...versionsWithDeliverableName];
      }
    });
    
    // Trier par date de création, les plus récentes en premier
    return allVersions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [stepDeliverables]);

  // Obtenir les versions du livrable actif
  const activeVersions = useMemo(() => {
    return activeDeliverable?.versions || [];
  }, [activeDeliverable]);
  
  // Trouver la version active
  const activeVersion = useMemo(() => {
    // Chercher d'abord dans toutes les versions de tous les livrables de l'étape (allStepVersions)
    // Si non trouvé, chercher dans les versions du livrable actif (fallback)
    return allStepVersions.find((v: Version) => v.id === currentVersion) ||
      activeVersions.find((v: Version) => v.id === currentVersion) ||
      (activeVersions.length > 0 ? activeVersions[activeVersions.length - 1] : null);
  }, [allStepVersions, activeVersions, currentVersion]);

  // Trouver l'étape active
  const activeStep = useMemo(() => {
    return projectSteps.find(step => step.id === currentMilestone) || null;
  }, [projectSteps, currentMilestone]);

  // Fonction pour gérer la sélection d'une étape
  const handleMilestoneClick = (stepId: string, showLatest: boolean = false) => {
    console.log("handleMilestoneClick called with stepId:", stepId, "showLatest:", showLatest);
    
    // Force showLatest to true for consistent behavior
    showLatest = true;
    
    // Vérifier d'abord si l'identifiant correspond à une étape réelle
    const step = projectSteps.find(s => s.id === stepId);
    
    if (step) {
      console.log("Étape sélectionnée:", {
        id: step.id,
        title: step.title,
        status: step.status
      });
      
      // Ne pas traiter les étapes à venir
      if (step.status === "upcoming") {
        return;
      }
      
      // Sélectionner l'étape
      setCurrentMilestone(step.id);
      
      // Chercher les livrables associés à cette étape
      const relatedDeliverables = deliverables.filter(d => 
        (d.step_id && d.step_id === step.id) || d.id === step.id
      );
      
      console.log("Livrables associés:", relatedDeliverables.map(d => ({ 
        id: d.id, 
        title: d.title,
        versions: d.versions?.length || 0
      })));
      
      if (relatedDeliverables.length > 0) {
        // Prendre le premier livrable associé à cette étape
        const deliverable = relatedDeliverables[0];
        
        // S'il a des versions, sélectionner la dernière ou celle marquée comme dernière
        if (deliverable.versions && deliverable.versions.length > 0) {
          console.log("Versions disponibles:", deliverable.versions.map((v: Version) => ({
            id: v.id,
            name: v.version_name,
            date: v.created_at,
            is_latest: v.is_latest
          })));
          
          // Toujours trier les versions par date de création (la plus récente en premier)
          const sortedVersions = [...deliverable.versions].sort((a: Version, b: Version) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const latestVersion = sortedVersions[0];
          
          console.log("Version la plus récente:", {
            id: latestVersion.id,
            name: latestVersion.version_name,
            date: latestVersion.created_at
          });
          
          setCurrentVersion(latestVersion.id);
          
          // Notification
          toast({
            title: "Étape sélectionnée",
            description: `${step.title} - ${latestVersion.version_name || "Dernière version"}`
          });
        } else {
          toast({
            title: "Étape sélectionnée",
            description: `${step.title} - Aucune version disponible`
          });
        }
      } else {
        // Aucun livrable associé à cette étape
        toast({
          title: "Étape sélectionnée",
          description: `${step.title} - Aucun livrable disponible`
        });
      }
    } 
    // Si ce n'est pas une étape, c'est peut-être un livrable (pour la rétrocompatibilité)
    else {
      // Vérification si le livrable existe
      const deliverable = deliverables.find(d => d.id === stepId);
      if (!deliverable) {
        toast({
          title: "Erreur",
          description: "Étape ou livrable non trouvé",
          variant: "destructive"
        });
        return;
      }
      
      // Ne pas traiter les livrables à venir
      if (deliverable.status === "upcoming") {
        return;
      }
      
      // Sélectionner le livrable
      setCurrentMilestone(deliverable.id);
      
      // S'il a des versions, sélectionner la dernière ou celle marquée comme dernière
      if (deliverable.versions && deliverable.versions.length > 0) {
        console.log("Versions disponibles pour le livrable:", deliverable.versions.map((v: Version) => ({
          id: v.id,
          name: v.version_name,
          date: v.created_at,
          is_latest: v.is_latest
        })));
        
        // Toujours trier les versions par date de création (la plus récente en premier)
        const sortedVersions = [...deliverable.versions].sort((a: Version, b: Version) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const latestVersion = sortedVersions[0];
        
        console.log("Version la plus récente du livrable:", {
          id: latestVersion.id,
          name: latestVersion.version_name,
          date: latestVersion.created_at
        });
        
        setCurrentVersion(latestVersion.id);
        
        // Notification
        toast({
          title: "Livrable sélectionné",
          description: `${deliverable.title} - ${latestVersion.version_name || "Dernière version"}`
        });
      } else {
        toast({
          title: "Livrable sélectionné",
          description: `${deliverable.title} - Aucune version disponible`
        });
      }
    }
    
    // Forcer l'onglet "current"
    setActiveTab("current" as TabType);
    
    // Maintain scroll position at top
    setTimeout(() => {
      const contentContainer = document.querySelector('[data-value="current"]');
      if (contentContainer) {
        contentContainer.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      }
    }, 10);
    
    // Garder le sélecteur ouvert
    // setIsDeliverableSelectorOpen(false);
  };

  // Fonction pour gérer le changement de version
  const handleVersionChange = (versionId: string) => {
    console.log("Changing version to:", versionId);
    
    // Rechercher la version dans toutes les versions d'étape
    const targetVersion = allStepVersions.find(v => v.id === versionId);
    console.log("Version trouvée dans allStepVersions:", targetVersion ? {
      id: targetVersion.id,
      nom: targetVersion.version_name,
      url: targetVersion.file_url,
      livrable: targetVersion.deliverable_title || "Non spécifié"
    } : "Non trouvée");
    
    // Définir la version sélectionnée
    setCurrentVersion(versionId);

    // Trouver le livrable auquel appartient cette version (pour information seulement)
    let deliverableTitle = "";
    for (const deliverable of deliverables) {
      if (deliverable.versions) {
        const versionExists = deliverable.versions.some((v: Version) => v.id === versionId)
        if (versionExists) {
          console.log("Found version in deliverable:", deliverable.id, deliverable.title);
          deliverableTitle = deliverable.title;
          break;
        }
      }
    }
    
    // Afficher une notification pour confirmer l'action
    if (deliverableTitle) {
      toast({
        title: "Version sélectionnée",
        description: "Affichage de la version pour " + deliverableTitle
      });
    }

    // Forcer l'onglet "current"
    setActiveTab("current" as TabType);
  };

  // Fonction pour basculer l'affichage du sélecteur de livrables
  const toggleDeliverableSelector = () => {
    // Basculer entre afficher et masquer
    setIsDeliverableSelectorOpen(prev => !prev);
    
    // Scroll to the top of the content area
    setTimeout(() => {
      const contentContainer = document.querySelector('[data-value="current"]');
      if (contentContainer) {
        contentContainer.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      }
    }, 10);
  };
  
  // S'assurer que le sélecteur de livrables est toujours visible
  useEffect(() => {
    // Toujours garder le sélecteur ouvert
    setIsDeliverableSelectorOpen(true);
  }, [activeTab]); // Se déclenche à chaque changement d'onglet

  return {
    currentMilestone,
    setCurrentMilestone,
    currentVersion,
    setCurrentVersion,
    activeTab,
    setActiveTab,
    isDeliverableSelectorOpen,
    setIsDeliverableSelectorOpen,
    activeDeliverable,
    stepDeliverables,
    allStepVersions,
    activeVersions,
    activeVersion,
    activeStep,
    handleMilestoneClick,
    handleVersionChange,
    toggleDeliverableSelector
  };
} 