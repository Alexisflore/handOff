import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CurrentUser } from "../components/client-portal/types";

export function useUserData() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [debugInfo, setDebugInfo] = useState<{[key: string]: any}>({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const debugData: {[key: string]: any} = {
          logs: []
        };
        
        debugData.logs.push("Début de la vérification");
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Récupération de la session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        debugData.hasSession = !!session;
        
        if (error) {
          debugData.sessionError = error.message;
          setDebugInfo(debugData);
          return;
        }
        
        if (session && session.user) {
          debugData.userId = session.user.id;
          debugData.userEmail = session.user.email;
          debugData.userMetadata = session.user.user_metadata;
          debugData.rawSession = JSON.stringify(session, null, 2);
          
          try {
            // Recherche du rôle dans différents endroits possibles
            const roleFromMetadata = session.user.user_metadata?.role;
            const roleFromAppMetadata = session.user.app_metadata?.role;
            
            debugData.logs.push(`Role from metadata: ${roleFromMetadata || 'none'}`);
            debugData.logs.push(`Role from app_metadata: ${roleFromAppMetadata || 'none'}`);
            
            // Créer un tableau de tous les rôles potentiels
            const potentialRoles = [
              roleFromMetadata,
              roleFromAppMetadata,
              session.user.role
            ].filter(Boolean); // Filtrer les valeurs null/undefined
            
            debugData.potentialRoles = potentialRoles;
            
            // Vérifier si l'un des rôles correspond à "designer" (insensible à la casse)
            const isDesigner = potentialRoles.some(role => 
              typeof role === 'string' && role.toLowerCase() === 'designer'
            );
            
            // Vérifier aussi le rôle spécifique "DESIGNER"
            const isDesignerExact = potentialRoles.some(role => 
              typeof role === 'string' && role.toUpperCase() === 'DESIGNER'
            );
            
            debugData.isDesignerByAnyCase = isDesigner;
            debugData.isDesignerExact = isDesignerExact;
            
            // Vérifier également l'ID utilisateur comme fallback
            const isDesignerById = session.user.id === process.env.NEXT_PUBLIC_DESIGNER_ID;
            debugData.isDesignerById = isDesignerById;
            
            // Décision finale: l'utilisateur est un designer si l'un des tests ci-dessus est vrai
            const finalIsDesigner = isDesigner || isDesignerExact || isDesignerById;
            debugData.finalIsDesigner = finalIsDesigner;
            
            // Si l'utilisateur n'est pas reconnu comme designer mais a un ID de designer,
            // essayons de mettre à jour les métadonnées pour les futurs chargements
            if (isDesignerById && !isDesignerExact && !isDesigner) {
              debugData.logs.push("Tentative de mise à jour des métadonnées car ID designer sans rôle designer");
              
              // Mise à jour des métadonnées de l'utilisateur
              const { error: updateError } = await supabase.auth.updateUser({
                data: { role: 'DESIGNER' }
              });
              
              if (updateError) {
                debugData.logs.push(`Erreur mise à jour métadonnées: ${updateError.message}`);
              } else {
                debugData.logs.push("Métadonnées mises à jour avec succès");
              }
            }
            
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              role: roleFromMetadata || roleFromAppMetadata || session.user.role || 'unknown',
              isDesigner: finalIsDesigner
            });
          } catch (error: any) {
            debugData.parseError = error.message;
          }
        }
        
        setDebugInfo(debugData);
      } catch (error: any) {
        setDebugInfo({ globalError: error.message });
      }
    }
    
    fetchCurrentUser()
  }, [])

  return { currentUser, debugInfo, showDebug, setShowDebug };
} 