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
        console.log("🔍 useUserData: Starting user data fetch");
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
        console.log("🔍 useUserData: Has session?", !!session);
        
        if (error) {
          console.error("🔍 useUserData: Session error", error);
          debugData.sessionError = error.message;
          setDebugInfo(debugData);
          return;
        }
        
        if (session && session.user) {
          console.log("🔍 useUserData: Session user found", session.user.id);
          debugData.userId = session.user.id;
          debugData.userEmail = session.user.email;
          debugData.userMetadata = session.user.user_metadata;
          debugData.rawSession = JSON.stringify(session, null, 2);
          
          // Fetch user data from public users table using auth user ID
          console.log("🔍 useUserData: Fetching from public users table with auth_user_id =", session.user.id);
          
          // For debugging - log all users in the table first
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('*');
            
          console.log("🔍 useUserData: All users in public table:", allUsers);
          debugData.allUsers = allUsers;
          
          if (allUsersError) {
            console.error("🔍 useUserData: Error fetching all users", allUsersError);
            debugData.allUsersError = allUsersError.message;
          }
          
          // First try with auth_user_id
          let userData = null;
          let userError = null;
          
          try {
            const result = await supabase
              .from('users')
              .select('full_name, avatar_url')
              .eq('auth_user_id', session.user.id)
              .single();
              
            userData = result.data;
            userError = result.error;
            
            if (userError || !userData) {
              console.log("🔍 useUserData: First attempt with auth_user_id failed, trying with id");
              
              // Try with 'id' column as fallback
              const secondResult = await supabase
                .from('users')
                .select('full_name, avatar_url')
                .eq('id', session.user.id)
                .single();
                
              if (!secondResult.error && secondResult.data) {
                userData = secondResult.data;
                userError = null;
                console.log("🔍 useUserData: Found user with id column");
              } else {
                console.log("🔍 useUserData: Second attempt with id failed");
                
                // If both queries failed, check if we can find the user by email
                if (session.user.email) {
                  console.log("🔍 useUserData: Trying to find user by email");
                  const emailResult = await supabase
                    .from('users')
                    .select('full_name, avatar_url')
                    .eq('email', session.user.email)
                    .single();
                    
                  if (!emailResult.error && emailResult.data) {
                    userData = emailResult.data;
                    userError = null;
                    console.log("🔍 useUserData: Found user with email match");
                  }
                }
              }
            }
          } catch (e) {
            console.error("🔍 useUserData: Error during user data queries", e);
          }
            
          debugData.publicUserData = userData;
          console.log("🔍 useUserData: Final public user data result:", userData);
          
          if (userError) {
            console.error("🔍 useUserData: Public user fetch error", userError);
            debugData.publicUserError = userError.message;
          }
          
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
            
            // Prioritize full_name from the public users table if available
            const fullName = userData?.full_name || 
                            session.user.user_metadata?.full_name || 
                            session.user.user_metadata?.name || 
                            session.user.email?.split('@')[0] || 
                            'Utilisateur';
            
            // Prioritize avatar_url from the public users table if available
            const avatarUrl = userData?.avatar_url || session.user.user_metadata?.avatar_url;
            
            const userObject = {
              id: session.user.id,
              email: session.user.email,
              role: roleFromMetadata || roleFromAppMetadata || session.user.role || 'unknown',
              isDesigner: finalIsDesigner,
              full_name: fullName,
              avatar_url: avatarUrl
            };
            
            console.log("🔍 useUserData: Setting currentUser to", userObject);
            setCurrentUser(userObject);
            
            // Log pour débogage
            console.log("DEBUG User Metadata:", {
              rawMetadata: session.user.user_metadata,
              publicUserData: userData,
              full_name: session.user.user_metadata?.full_name,
              name: session.user.user_metadata?.name,
              email: session.user.email,
              fallbackName: session.user.email?.split('@')[0],
              finalFullName: fullName,
              avatarUrl: avatarUrl
            });
          } catch (error: any) {
            console.error("🔍 useUserData: Error in user data processing", error);
            debugData.parseError = error.message;
          }
        } else {
          console.warn("🔍 useUserData: No session user found");
        }
        
        setDebugInfo(debugData);
      } catch (error: any) {
        console.error("🔍 useUserData: Global error", error);
        setDebugInfo({ globalError: error.message });
      }
    }
    
    fetchCurrentUser();
  }, []);

  return { currentUser, debugInfo, showDebug, setShowDebug };
} 