import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // ID d'un utilisateur existant (récupérons d'abord un utilisateur valide)
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .limit(1)
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Aucun utilisateur trouvé" }, { status: 404 })
    }
    
    const designerId = users[0].id
    const clientId = users[0].id // Pour simplifier, on utilise le même ID
    
    // Récupérer les étapes existantes
    const { data: steps, error: stepsError } = await supabase
      .from("project_steps")
      .select("id, title")
      .eq("project_id", projectId)
    
    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 })
    }
    
    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: "Aucune étape trouvée pour ce projet" }, { status: 404 })
    }
    
    // Trouver l'ID de l'étape Logo Refinement
    const logoRefinementStep = steps.find(s => s.title === "Logo Refinement")
    
    if (!logoRefinementStep) {
      return NextResponse.json({ error: "Étape Logo Refinement non trouvée" }, { status: 404 })
    }
    
    // Ajouter un livrable à l'étape Logo Refinement
    const deliverableId = uuidv4()
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .insert([
        {
          id: deliverableId,
          step_id: logoRefinementStep.id,
          project_id: projectId,
          title: "Logo Color Variations",
          description: "Variations de couleurs pour le logo sélectionné",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Color+Variations",
          file_name: "logo_color_variations.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Color Variations v1",
          version_number: 1,
          is_latest: true,
          status: "pending",
          created_at: new Date().toISOString(),
        }
      ])
      .select()
    
    if (deliverableError) {
      return NextResponse.json({ error: deliverableError.message }, { status: 500 })
    }
    
    // Ajouter des commentaires au livrable
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .insert([
        {
          id: uuidv4(),
          deliverable_id: deliverableId,
          project_id: projectId,
          user_id: clientId,
          content: "J'aime beaucoup la palette de couleurs utilisée. Est-ce qu'on pourrait voir une version avec des tons plus froids?",
          created_at: new Date().toISOString(),
          milestone_name: "Logo Refinement",
          version_name: "Color Variations v1",
          is_client: true,
        },
        {
          id: uuidv4(),
          deliverable_id: deliverableId,
          project_id: projectId,
          user_id: designerId,
          content: "Bien sûr, je vais préparer une version avec des tons plus froids. Préférez-vous des bleus ou des verts?",
          created_at: new Date(Date.now() + 3600000).toISOString(),
          milestone_name: "Logo Refinement",
          version_name: "Color Variations v1",
          is_client: false,
        }
      ])
      .select()
    
    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Livrables et commentaires ajoutés avec succès",
      logoRefinementStep,
      deliverable,
      comments,
      userId: designerId
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 })
  }
} 