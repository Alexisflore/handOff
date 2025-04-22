import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const designerId = process.env.DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"
    const supabase = createServerSupabaseClient()
    
    // Utilise l'authentification par email et mot de passe
    // Ces infos doivent correspondre à celles du script de seed
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "designer@example.com",
      password: "designerpass123"
    })
    
    if (error) {
      console.error("Supabase auth error:", error)
      return NextResponse.json({ 
        success: false,
        error: error.message
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Connecté en tant que designer",
      userId: designerId,
      sessionId: data.session?.user.id || null
    })
  } catch (error) {
    console.error("Erreur lors de la connexion designer:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la connexion"
    }, { status: 500 })
  }
} 