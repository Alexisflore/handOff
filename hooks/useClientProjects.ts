import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  client_id: string;
  created_at: string;
}

export function useClientProjects(clientId: string | null, currentProject?: any) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!clientId) {
      setProjects([]);
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Assurez-vous que currentProject est ajouté même si la requête échoue
        let projectsList: Project[] = [];
        
        // Ajouter le projet actuel s'il existe et correspond au client actuel
        if (currentProject && currentProject.id && currentProject.client_id === clientId) {
          projectsList.push({
            id: currentProject.id,
            title: currentProject.title || "Projet actuel",
            description: currentProject.description,
            status: currentProject.status || "in_progress",
            client_id: currentProject.client_id,
            created_at: currentProject.created_at || new Date().toISOString()
          });
        }

        // Récupérer les autres projets du client - SANS la colonne description qui cause l'erreur
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, status, client_id, created_at") // Retiré description ici
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          // Continuer avec juste le projet actuel si disponible
        } else if (data && data.length > 0) {
          // Filtrer pour éviter les doublons avec le projet actuel
          const additionalProjects = data.filter(
            p => !currentProject || p.id !== currentProject.id
          ).map(project => ({
            ...project,
            description: "" // Ajouter un champ description vide pour respecter l'interface
          }));
          
          projectsList = [...projectsList, ...additionalProjects];
        }

        setProjects(projectsList);
      } catch (error: any) {
        console.error("Error fetching client projects:", error);
        setError(typeof error === 'string' ? error : 'Erreur lors du chargement des projets');
        
        // Utiliser au moins le projet actuel si disponible
        if (currentProject && currentProject.client_id === clientId) {
          setProjects([{
            id: currentProject.id,
            title: currentProject.title || "Projet actuel",
            description: currentProject.description || "",
            status: currentProject.status || "in_progress",
            client_id: currentProject.client_id,
            created_at: currentProject.created_at || new Date().toISOString()
          }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [clientId, currentProject, toast]);

  return { projects, isLoading, error };
} 