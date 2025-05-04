import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";

export function useProjectSteps(project: any, deliverables: any[]) {
  const [projectSteps, setProjectSteps] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (project?.id) {
      // Fonction pour récupérer les étapes du projet
      const fetchProjectSteps = async () => {
        try {
          // Vérifier que les variables d'environnement sont définies
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Variables d'environnement Supabase non définies");
            // Utiliser les données des livrables existants comme fallback
            setProjectSteps(deliverables);
            return;
          }
          
          const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
          
          if (!project.id) {
            console.error("ID du projet non défini");
            setProjectSteps(deliverables);
            return;
          }
          
          const { data, error } = await supabase
            .from('project_steps')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: true });
            
          if (error) {
            console.error("Erreur lors de la récupération des étapes du projet:", error);
            // Utiliser les données des livrables existants comme fallback
            setProjectSteps(deliverables);
            return;
          }
          
          if (data && Array.isArray(data) && data.length > 0) {
            console.log("Étapes du projet récupérées:", data);
            setProjectSteps(data);
          } else {
            console.log("Aucune étape trouvée, utilisation des livrables comme fallback");
            // Utiliser les données des livrables existants comme fallback
            setProjectSteps(deliverables);
          }
        } catch (error) {
          console.error("Exception lors de la récupération des étapes:", error);
          // Utiliser les données des livrables existants comme fallback
          setProjectSteps(deliverables);
          // Afficher une notification
          toast({
            title: "Problème de connexion",
            description: "Impossible de récupérer les étapes du projet. Mode hors ligne activé.",
            variant: "default"
          });
        }
      };
      
      fetchProjectSteps();
    } else {
      // Si pas d'ID de projet, utiliser les livrables comme fallback
      setProjectSteps(deliverables);
    }
  }, [project?.id, deliverables, toast]);

  return projectSteps;
} 