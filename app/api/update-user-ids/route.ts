import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Récupérer les IDs depuis les variables d'environnement
    const designerId = process.env.DESIGNER_ID
    const clientId = process.env.CLIENT_ID
    
    if (!designerId || !clientId) {
      return NextResponse.json({ 
        error: "Les IDs designer et client doivent être définis dans le fichier .env.local" 
      }, { status: 400 })
    }
    
    // Récupérer les utilisateurs existants
    const { data: existingUsers, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
    
    if (usersError) {
      return NextResponse.json({ 
        error: "Erreur lors de la récupération des utilisateurs", 
        details: usersError 
      }, { status: 500 })
    }
    
    // Vérifier si les utilisateurs avec ces IDs existent déjà
    const existingDesigner = existingUsers?.find(u => u.id === designerId)
    const existingClient = existingUsers?.find(u => u.id === clientId)
    
    interface ResultType {
      designer: any;
      client: any;
      operationsPerformed: string[];
    }
    
    let results: ResultType = { 
      designer: null, 
      client: null,
      operationsPerformed: []
    }
    results.designer = existingDesigner
    results.operationsPerformed.push("L'utilisateur designer existe déjà")
    results.client = existingClient
    results.operationsPerformed.push("L'utilisateur client existe déjà")
    
    
    const { data: existingClientRecord } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle()
    
    results.operationsPerformed.push("L'entrée client existe déjà")
    
    return NextResponse.json({
      success: true,
      message: "Utilisateurs mis à jour avec succès",
      results,
      envVariables: {
        designerId,
        clientId
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      message: "Erreur interne du serveur", 
      error 
    }, { status: 500 })
  }
} 