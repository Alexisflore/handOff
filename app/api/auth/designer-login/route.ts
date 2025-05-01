import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Configuration par défaut pour le designer
const DESIGNER_EMAIL = "designer@example.com"
const DESIGNER_PASSWORD = "designerpass123"
// ID fixe de l'utilisateur designer qui existe déjà dans Auth
const DESIGNER_AUTH_ID = "28bcc9e1-ad63-4717-89e2-f4b13d50c2e6"
// ID qui existe dans la table users (différent de celui dans auth)
const DESIGNER_USERS_ID = "550e8400-e29b-41d4-a716-446655440001"

export async function POST(request: Request) {
  try {
    console.log("Tentative de connexion designer");
    
    const supabase = createServerSupabaseClient()
    
    // Déconnecter l'utilisateur actuel si nécessaire
    await supabase.auth.signOut();
    
    // Connexion directe avec email/mot de passe
    console.log("Tentative de connexion directe avec email:", DESIGNER_EMAIL);
    
    const authResponse = await supabase.auth.signInWithPassword({
      email: DESIGNER_EMAIL,
      password: DESIGNER_PASSWORD
    });
    
    if (authResponse.error) {
      console.error("Erreur d'authentification:", authResponse.error);
      return NextResponse.json({ 
        success: false, 
        error: "Erreur d'authentification: " + authResponse.error.message
      }, { status: 401 });
    }
    
    // Si l'authentification a réussi, gérer la session avec l'ID de la table users
    return handleSuccessfulAuth(authResponse.data, supabase);
    
  } catch (error) {
    console.error("Erreur lors de la connexion designer:", error);
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la connexion: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

// Fonction séparée pour gérer l'authentification réussie
async function handleSuccessfulAuth(data: any, supabase: any) {
  // Vérifier que data.user et data.session ne sont pas null
  if (!data || !data.user || !data.session) {
    return NextResponse.json({
      success: false,
      error: "Authentification réussie mais données utilisateur manquantes"
    }, { status: 500 });
  }
  
  // Mettre à jour les métadonnées de la session active pour inclure le lien vers l'ID de la table users
  try {
    await supabase.auth.updateUser({
      data: { 
        role: 'DESIGNER', 
        isDesigner: true,
        usersTableId: DESIGNER_USERS_ID
      }
    });
  } catch (updateError) {
    console.error("Erreur lors de la mise à jour des métadonnées de session:", updateError);
    // Continuer malgré l'erreur
  }
  
  // S'assurer que les cookies sont définis correctement pour la session
  const response = NextResponse.json({
    success: true,
    message: "Connecté en tant que designer",
    // IMPORTANT: Renvoyer l'ID de la table users plutôt que l'ID Auth
    userId: DESIGNER_USERS_ID,
    sessionId: data.session.user.id || null,
    role: "DESIGNER"
  });
  
  if (data.session) {
    // Définir spécifiquement les cookies nécessaires avec les noms exacts de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const domain = new URL(supabaseUrl).hostname;
    
    // Préparer les données de session avec les métadonnées correctes
    // et l'ID de la table users pour le client
    const sessionData = {
      ...data.session,
      user: {
        ...data.session.user,
        id: DESIGNER_USERS_ID, // Forcer l'ID à être celui de la table users
        user_metadata: {
          ...data.session.user.user_metadata,
          role: 'DESIGNER',
          isDesigner: true,
          usersTableId: DESIGNER_USERS_ID // Stocker l'ID de la table users dans les métadonnées
        }
      }
    };
    
    // Définir les cookies
    response.cookies.set('sb-access-token', sessionData.access_token, {
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? domain : undefined
    });
    
    response.cookies.set('sb-refresh-token', sessionData.refresh_token, {
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? domain : undefined
    });
    
    // Ajouter également le cookie complet de Supabase avec l'ID modifié
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
    response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      user: {
        id: DESIGNER_USERS_ID, // Utiliser l'ID de la table users partout
        app_metadata: sessionData.user.app_metadata,
        user_metadata: {
          ...data.session.user.user_metadata,
          role: 'DESIGNER',
          isDesigner: true,
          usersTableId: DESIGNER_USERS_ID
        },
        aud: sessionData.user.aud,
        email: data.user.email
      }
    }), {
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? domain : undefined
    });
    
    console.log("Connexion designer réussie, cookies définis avec ID table users:", DESIGNER_USERS_ID);
  }
  
  return response;
} 