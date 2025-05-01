import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Configuration par défaut pour le designer
const DESIGNER_EMAIL = "designer@example.com"
const DESIGNER_PASSWORD = "designerpass123"
const DESIGNER_ID = process.env.DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    console.log("Tentative de connexion designer avec email:", DESIGNER_EMAIL)
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: getUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", DESIGNER_ID)
      .single()

    console.log("Utilisateur existant:", !!existingUser)
    
    // Si l'utilisateur n'existe pas dans la table users, le créer
    if (!existingUser && !getUserError) {
      console.log("Création de l'utilisateur designer dans la table users...")
      
      // Créer l'entrée dans la table users
      const { error: createUserError } = await supabase
        .from("users")
        .insert({
          id: DESIGNER_ID,
          email: DESIGNER_EMAIL,
          first_name: "Designer",
          last_name: "Demo",
          role: "DESIGNER"
        })
      
      if (createUserError) {
        console.error("Erreur lors de la création de l'utilisateur dans la table users:", createUserError)
        return NextResponse.json({ 
          success: false, 
          error: "Impossible de créer l'utilisateur designer"
        }, { status: 500 })
      }
    }
    
    // Vérifier si le designer existe dans Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(DESIGNER_ID)
    
    // Si l'utilisateur n'existe pas dans Auth, le créer
    if (!authUser && authError) {
      console.log("Création de l'utilisateur designer dans Auth...")
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: DESIGNER_EMAIL,
        password: DESIGNER_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'DESIGNER' },
        id: DESIGNER_ID
      })
      
      if (createError) {
        console.error("Erreur lors de la création de l'utilisateur:", createError)
        return NextResponse.json({ 
          success: false, 
          error: "Impossible de créer l'utilisateur designer"
        }, { status: 500 })
      }
      
      console.log("Utilisateur designer créé avec succès:", !!newUser)
    } else if (authUser) {
      // Mettre à jour les métadonnées de l'utilisateur existant pour s'assurer que le rôle est correctement défini
      console.log("Mise à jour des métadonnées de l'utilisateur designer...")
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        DESIGNER_ID,
        { user_metadata: { role: 'DESIGNER' } }
      )
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour des métadonnées:", updateError)
        // Continuons malgré l'erreur, nous allons quand même essayer de nous connecter
      }
    }
    
    // Utilise l'authentification par email et mot de passe
    const authResponse = await supabase.auth.signInWithPassword({
      email: DESIGNER_EMAIL,
      password: DESIGNER_PASSWORD
    })
    
    if (authResponse.error) {
      console.error("Supabase auth error:", authResponse.error)
      return NextResponse.json({ 
        success: false,
        error: authResponse.error.message
      }, { status: 401 })
    }
    
    const { data } = authResponse
    
    // Mettre à jour les métadonnées de la session actuelle
    if (data.session) {
      const { error: sessionUpdateError } = await supabase.auth.updateUser({
        data: { role: 'DESIGNER' }
      })
      
      if (sessionUpdateError) {
        console.error("Erreur lors de la mise à jour des métadonnées de session:", sessionUpdateError)
      }
    }
    
    // S'assurer que les cookies sont définis correctement pour la session
    const response = NextResponse.json({
      success: true,
      message: "Connecté en tant que designer",
      userId: DESIGNER_ID,
      sessionId: data.session?.user.id || null,
      role: "DESIGNER"
    })
    
    if (data.session) {
      // Utiliser directement la fonction Supabase signInWithPassword
      // qui se charge de définir les cookies correctement
      
      // Définir spécifiquement les cookies nécessaires avec les noms exacts de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const domain = new URL(supabaseUrl).hostname
      
      // Préparer les données de session avec les métadonnées correctes
      const sessionData = {
        ...data.session,
        user: {
          ...data.session.user,
          user_metadata: {
            ...data.session.user.user_metadata,
            role: 'DESIGNER'
          }
        }
      }
      
      response.cookies.set('sb-access-token', sessionData.access_token, {
        maxAge: 60 * 60 * 24,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? domain : undefined
      })
      
      response.cookies.set('sb-refresh-token', sessionData.refresh_token, {
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? domain : undefined
      })
      
      // Ajouter également le cookie complet de Supabase
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || ''
      response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        user: {
          id: sessionData.user.id,
          app_metadata: sessionData.user.app_metadata,
          user_metadata: {
            ...sessionData.user.user_metadata,
            role: 'DESIGNER'
          },
          aud: sessionData.user.aud,
          email: sessionData.user.email
        }
      }), {
        maxAge: 60 * 60 * 24,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? domain : undefined
      })
      
      console.log("Connexion designer réussie, cookies définis correctement avec rôle DESIGNER")
    }
    
    return response
  } catch (error) {
    console.error("Erreur lors de la connexion designer:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la connexion: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
} 