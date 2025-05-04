import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getProjectDetails } from "@/services/project-service";

export function useProjectData(projectId: string, initialSharedFiles: any[]) {
  const [sharedFiles, setSharedFiles] = useState(initialSharedFiles);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshProjectData = async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      const data = await getProjectDetails(projectId);
      
      if (data) {
        // Mettre à jour les données locales
        setSharedFiles(data.sharedFiles);
        
        // Si venant d'une approbation, force reload
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('approved') === 'true') {
          // Forcer le rechargement de la page pour voir les modifications
          window.location.reload();
          return;
        }
        
        toast({
          title: "Données actualisées",
          description: "Les données du projet ont été actualisées avec succès.",
        });
      }
    } catch (error) {
      console.error("Error refreshing project data:", error);

      toast({
        title: "Erreur d'actualisation",
        description: "Une erreur s'est produite lors de l'actualisation des données.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    sharedFiles,
    setSharedFiles,
    isRefreshing,
    refreshProjectData
  };
} 