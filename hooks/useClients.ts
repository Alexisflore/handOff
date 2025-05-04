import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";

export interface Client {
  id: string;
  company: string;
  name: string;
  email?: string;
  logo_url?: string;
  initials: string;
}

export function useClients(userId: string | undefined, isDesigner: boolean = false, currentClient?: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Commencer avec le client actuel si disponible
        let clientsList: Client[] = [];
        if (currentClient && currentClient.id) {
          clientsList.push({
            id: currentClient.id,
            company: currentClient.company || "Client actuel",
            name: currentClient.name || "",
            email: currentClient.email,
            logo_url: currentClient.logo_url,
            initials: getInitials(currentClient.company || "Client")
          });
        }

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        if (isDesigner) {
          try {
            // Pour les freelancers: obtenir d'autres clients si possible
            // Récupérer l'ID du freelancer
            const { data: freelancerData, error: freelancerError } = await supabase
              .from("freelancers")
              .select("id")
              .eq("user_id", userId)
              .maybeSingle();
              
            if (freelancerError && freelancerError.code !== 'PGRST116') {
              console.error("Freelancer error:", freelancerError);
            } else if (freelancerData) {
              const freelancerId = freelancerData.id;
              
              // Obtenir les IDs de projets associés à ce freelancer
              const { data: projectData, error: projectError } = await supabase
                .from("project_freelancers")
                .select("project_id")
                .eq("freelancer_id", freelancerId);
                
              if (projectError) {
                console.error("Project error:", projectError);
              } else if (projectData && projectData.length > 0) {
                const projectIds = projectData.map(p => p.project_id);
                
                // Obtenir les clients de ces projets
                const { data: projectsWithClients, error: clientsError } = await supabase
                  .from("projects")
                  .select(`
                    client_id
                  `)
                  .in("id", projectIds);
                  
                if (clientsError) {
                  console.error("Clients error:", clientsError);
                } else if (projectsWithClients && projectsWithClients.length > 0) {
                  const clientIds = [...new Set(projectsWithClients.map(p => p.client_id))];
                  
                  // Filtrer l'ID du client actuel s'il existe déjà
                  const remainingClientIds = currentClient && currentClient.id 
                    ? clientIds.filter(id => id !== currentClient.id)
                    : clientIds;
                    
                  if (remainingClientIds.length > 0) {
                    // Récupérer les données client
                    const { data: additionalClients, error: additionalError } = await supabase
                      .from("clients")
                      .select("id, company, name, email, logo_url")
                      .in("id", remainingClientIds);
                      
                    if (additionalError) {
                      console.error("Additional clients error:", additionalError);
                    } else if (additionalClients) {
                      const additionalWithInitials = additionalClients.map(client => ({
                        ...client,
                        initials: getInitials(client.company)
                      }));
                      
                      clientsList = [...clientsList, ...additionalWithInitials];
                    }
                  }
                }
              }
            }
          } catch (designerError) {
            console.error("Error fetching designer clients:", designerError);
          }
        } else {
          // Pour les clients: récupérer son propre enregistrement client
          try {
            if (!currentClient || !currentClient.id) {
              const { data, error } = await supabase
                .from("clients")
                .select("id, company, name, email, logo_url")
                .eq("user_id", userId)
                .maybeSingle();

              if (error && error.code !== 'PGRST116') {
                console.error("Client error:", error);
              } else if (data) {
                clientsList = [{
                  ...data,
                  initials: getInitials(data.company)
                }];
              }
            }
          } catch (clientError) {
            console.error("Error fetching client record:", clientError);
          }
        }

        setClients(clientsList);
      } catch (error: any) {
        console.error("Error in useClients:", error);
        setError(typeof error === 'string' ? error : 'Erreur lors du chargement des clients');
        
        // Utiliser au moins le client actuel si disponible
        if (currentClient && currentClient.id) {
          setClients([{
            id: currentClient.id,
            company: currentClient.company || "Client actuel",
            name: currentClient.name || "",
            email: currentClient.email,
            logo_url: currentClient.logo_url,
            initials: getInitials(currentClient.company || "Client")
          }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [userId, isDesigner, currentClient, toast]);

  // Helper function to get initials
  const getInitials = (name: string): string => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return { clients, isLoading, error };
} 