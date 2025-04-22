import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // 1. Vérifier si le projet existe
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", "550e8400-e29b-41d4-a716-446655440020")
      .maybeSingle()
    
    if (projectError) {
      return NextResponse.json({ error: "Erreur lors de la vérification du projet", details: projectError }, { status: 500 })
    }
    
    // 2. Récupérer toutes les étapes, pas seulement celles du projet
    const { data: allSteps, error: stepsError } = await supabase
      .from("project_steps")
      .select("*")
      .limit(100)
    
    if (stepsError) {
      return NextResponse.json({ error: "Erreur lors de la récupération des étapes", details: stepsError }, { status: 500 })
    }
    
    // 3. Récupérer les logs d'erreur des dernières opérations (si disponible)
    const { data: projectSteps, error: projectStepsError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", "550e8400-e29b-41d4-a716-446655440020")
    
    if (projectStepsError) {
      return NextResponse.json({ error: "Erreur lors de la récupération des étapes du projet", details: projectStepsError }, { status: 500 })
    }
    
    // 4. Tester l'insertion directe d'une étape
    const testStepId = `test-step-${Date.now()}`
    const { data: insertResult, error: insertError } = await supabase
      .from("project_steps")
      .upsert([
        {
          id: testStepId,
          project_id: "550e8400-e29b-41d4-a716-446655440020",
          title: "Étape de test",
          description: "Étape créée pour diagnostiquer le problème",
          status: "pending",
          order_index: 999,
          due_date: new Date().toISOString(),
          icon: "Bug",
        }
      ])
      .select()
    
    return NextResponse.json({
      projectExists: !!project,
      projectData: project,
      allStepsCount: allSteps?.length || 0,
      projectStepsCount: projectSteps?.length || 0,
      projectSteps: projectSteps,
      testInsertError: insertError ? insertError.message : null,
      testInsertResult: insertResult,
      diagnostic: `Il y a ${allSteps?.length || 0} étapes au total dans la base de données, dont ${projectSteps?.length || 0} pour ce projet.`
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Erreur interne du serveur", error }, { status: 500 })
  }
} 