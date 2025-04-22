import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const designerId = process.env.DESIGNER_ID
    
    if (!designerId) {
      return NextResponse.json({ 
        error: "L'ID designer doit être défini dans le fichier .env.local" 
      }, { status: 400 })
    }
    
    // Récupérer les informations de l'utilisateur designer
    const { data: designer, error: designerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", designerId)
      .maybeSingle()
    
    if (designerError || !designer) {
      return NextResponse.json({ 
        error: "Utilisateur designer non trouvé", 
        details: designerError 
      }, { status: 500 })
    }
    
    // Créer une session pour l'utilisateur
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: designerId,
      expiresIn: 60 * 60 * 24 // 24 heures
    })
    
    if (sessionError) {
      return NextResponse.json({ 
        error: "Erreur lors de la création de la session", 
        details: sessionError.message 
      }, { status: 500 })
    }
    
    // Définir les cookies de session
    const cookieStore = cookies()
    cookieStore.set('sb-access-token', sessionData.session.access_token, {
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
    
    cookieStore.set('sb-refresh-token', sessionData.session.refresh_token, {
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
    
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'))
  } catch (error) {
    console.error("Erreur lors de la connexion:", error)
    return NextResponse.json({ 
      message: "Erreur interne du serveur", 
      error 
    }, { status: 500 })
  }
} 