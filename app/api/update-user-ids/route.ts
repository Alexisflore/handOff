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
    
    // 1. Si l'utilisateur designer n'existe pas, le créer
    if (!existingDesigner) {
      const { data: newDesigner, error: designerError } = await supabase
        .from("users")
        .insert([
          {
            id: designerId,
            email: "designer@example.com",
            full_name: "Alex Designer",
            avatar_url: "/placeholder.svg?height=64&width=64&text=AD"
          }
        ])
        .select()
      
      if (designerError) {
        return NextResponse.json({ 
          error: "Erreur lors de la création de l'utilisateur designer", 
          details: designerError 
        }, { status: 500 })
      }
      
      results.designer = newDesigner ? newDesigner[0] : null
      results.operationsPerformed.push("Création de l'utilisateur designer")
    } else {
      results.designer = existingDesigner
      results.operationsPerformed.push("L'utilisateur designer existe déjà")
    }
    
    // 2. Si l'utilisateur client n'existe pas, le créer
    if (!existingClient) {
      const { data: newClient, error: clientError } = await supabase
        .from("users")
        .insert([
          {
            id: clientId,
            email: "client@example.com",
            full_name: "John Client",
            avatar_url: "/placeholder.svg?height=64&width=64&text=JC"
          }
        ])
        .select()
      
      if (clientError) {
        return NextResponse.json({ 
          error: "Erreur lors de la création de l'utilisateur client", 
          details: clientError 
        }, { status: 500 })
      }
      
      results.client = newClient ? newClient[0] : null
      results.operationsPerformed.push("Création de l'utilisateur client")
    } else {
      results.client = existingClient
      results.operationsPerformed.push("L'utilisateur client existe déjà")
    }
    
    // 3. Créer ou mettre à jour les entrées dans la table freelancers et clients si nécessaires
    const { data: existingFreelancer } = await supabase
      .from("freelancers")
      .select("id")
      .eq("user_id", designerId)
      .maybeSingle()
    
    if (!existingFreelancer) {
      await supabase.from("freelancers").insert([
        {
          id: "550e8400-e29b-41d4-a716-446655440010", // Freelancer ID
          user_id: designerId,
          company: "Studio Creative",
          role: "UI/UX Designer",
          logo_url: "/placeholder.svg?height=32&width=32&text=SC",
          initials: "AD",
          phone: "+1 (555) 123-4567",
        }
      ])
      results.operationsPerformed.push("Création de l'entrée freelancer")
    } else {
      results.operationsPerformed.push("L'entrée freelancer existe déjà")
    }
    
    const { data: existingClientRecord } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle()
    
    if (!existingClientRecord) {
      await supabase.from("clients").insert([
        {
          id: clientId,
          name: "John Smith",
          company: "ACME Corporation",
          email: "john@acme.com",
          phone: "+1 (555) 123-4567",
          created_by: designerId,
          logo_url: "/placeholder.svg?height=48&width=48&text=AC",
          initials: "AC",
          role: "Marketing Director",
        }
      ])
      results.operationsPerformed.push("Création de l'entrée client")
    } else {
      results.operationsPerformed.push("L'entrée client existe déjà")
    }
    
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