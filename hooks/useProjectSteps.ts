import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";

export function useProjectSteps(project: any, deliverables: any[]) {
  const [projectSteps, setProjectSteps] = useState<any[]>([]);
  const { toast } = useToast();

  // Fonction pour ajouter une nouvelle étape au projet
  const addProjectStep = async (data: { stepName: string; stepDescription: string }) => {
    try {
      // Vérifier que les variables d'environnement sont définies
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Variables d'environnement Supabase non définies");
      }
      
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      
      if (!project.id) {
        throw new Error("ID du projet non défini");
      }
      
      // Calculer le order_index pour la nouvelle étape (nombre d'étapes existantes + 1)
      const order_index = projectSteps.length > 0 ? projectSteps.length : 0;
      console.log("Nouvel order_index calculé:", order_index);
      
      // Créer la nouvelle étape
      const { data: newStep, error } = await supabase
        .from('project_steps')
        .insert([
          {
            project_id: project.id,
            title: data.stepName,
            description: data.stepDescription,
            status: 'upcoming', // Par défaut, la nouvelle étape est à venir
            order_index: order_index // Ajouter l'index d'ordre calculé
          }
        ])
        .select()
        .single();
        
      if (error) {
        console.error("Erreur lors de l'ajout de l'étape:", error);
        throw new Error(error.message);
      }
      
      // Mettre à jour l'état local avec la nouvelle étape
      if (newStep) {
        setProjectSteps((prev) => [...prev, newStep]);
        
        // Notification de succès
        toast({
          title: "Étape ajoutée",
          description: `L'étape "${data.stepName}" a été ajoutée avec succès.`
        });
        
        return newStep;
      }
    } catch (error) {
      console.error("Exception lors de l'ajout de l'étape:", error);
      // Afficher une notification d'erreur
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter l'étape au projet.",
        variant: "destructive"
      });
      throw error;
    }
  };

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

  return { projectSteps, addProjectStep };
} 