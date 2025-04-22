import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const projectId = "550e8400-e29b-41d4-a716-446655440020"
    
    // Vérifier les étapes du projet
    const { data: steps, error: stepsError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true })
    
    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 })
    }
    
    // Récupérer l'étape 4 (Logo Refinement)
    const step4 = steps.find(step => step.title === "Logo Refinement")
    
    let deliverables = []
    if (step4) {
      // Vérifier les livrables de l'étape 4
      const { data: step4Deliverables, error: deliverablesError } = await supabase
        .from("deliverables")
        .select("*")
        .eq("step_id", step4.id)
      
      if (deliverablesError) {
        return NextResponse.json({ error: deliverablesError.message }, { status: 500 })
      }
      
      deliverables = step4Deliverables
    }
    
    // Vérifier si l'étape Social Media Assets existe
    const socialMediaStep = steps.find(step => step.title === "Social Media Assets")
    
    // Récupérer tous les commentaires du projet
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", projectId)
    
    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }
    
    // Récupérer les fichiers partagés
    const { data: files, error: filesError } = await supabase
      .from("shared_files")
      .select("*")
      .eq("project_id", projectId)
    
    if (filesError) {
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      stepCount: steps.length,
      steps: steps.map(s => ({ id: s.id, title: s.title, order_index: s.order_index })),
      logoRefinementStep: step4,
      logoRefinementDeliverables: deliverables,
      socialMediaStepExists: !!socialMediaStep,
      commentCount: comments.length,
      fileCount: files.length
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 })
  }
} 