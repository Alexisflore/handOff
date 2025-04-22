import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const projectId = "550e8400-e29b-41d4-a716-446655440020"
    
    // Utiliser les IDs depuis les variables d'environnement
    const designerId = process.env.DESIGNER_ID
    const clientId = process.env.CLIENT_ID
    
    if (!designerId || !clientId) {
      return NextResponse.json({ 
        error: "Les IDs designer et client doivent être définis dans le fichier .env.local" 
      }, { status: 400 })
    }
    
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
    
    // Trouver une étape Social Media Assets
    const socialMediaStep = steps.find(s => s.title === "Social Media Assets")
    
    // Ajouter un livrable à l'étape Logo Refinement
    const deliverableLogoId = uuidv4()
    const { data: deliverableLogo, error: deliverableLogoError } = await supabase
      .from("deliverables")
      .insert([
        {
          id: deliverableLogoId,
          step_id: logoRefinementStep.id,
          project_id: projectId,
          title: "Logo Final Version",
          description: "Version finale du logo avec toutes les corrections",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Final+Version",
          file_name: "logo_final.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Final Version",
          version_number: 3,
          is_latest: true,
          status: "pending",
          created_at: new Date().toISOString(),
        }
      ])
      .select()
    
    if (deliverableLogoError) {
      return NextResponse.json({ error: deliverableLogoError.message }, { status: 500 })
    }
    
    // Ajouter des livrables à l'étape Social Media si elle existe
    let socialMediaDeliverable = null
    let deliverableSocialId = null
    
    if (socialMediaStep) {
      deliverableSocialId = uuidv4()
      const { data: deliverableSocial, error: deliverableSocialError } = await supabase
        .from("deliverables")
        .insert([
          {
            id: deliverableSocialId,
            step_id: socialMediaStep.id,
            project_id: projectId,
            title: "Instagram Templates",
            description: "Templates pour la présence Instagram de la marque",
            file_url: "/placeholder.svg?height=600&width=450&text=Instagram+Templates",
            file_name: "instagram_templates.pdf",
            file_type: "pdf",
            created_by: designerId,
            version_name: "First Draft",
            version_number: 1,
            is_latest: true,
            status: "pending",
            created_at: new Date().toISOString(),
          }
        ])
        .select()
      
      if (deliverableSocialError) {
        return NextResponse.json({ error: deliverableSocialError.message }, { status: 500 })
      }
      
      socialMediaDeliverable = deliverableSocial
    }
    
    // Ajouter des commentaires aux livrables
    const commentsToAdd = []
    
    // Commentaires pour le livrable Logo Final
    commentsToAdd.push({
      id: uuidv4(),
      deliverable_id: deliverableLogoId,
      project_id: projectId,
      user_id: designerId,
      content: "Voici la version finale du logo qui intègre tous vos retours précédents.",
      created_at: new Date().toISOString(),
      milestone_name: "Logo Refinement",
      version_name: "Final Version",
      is_client: false,
    })
    
    commentsToAdd.push({
      id: uuidv4(),
      deliverable_id: deliverableLogoId,
      project_id: projectId,
      user_id: clientId,
      content: "Ce logo est parfait ! J'adore la façon dont vous avez intégré nos demandes tout en conservant la vision originale.",
      created_at: new Date(Date.now() + 3600000).toISOString(), // +1 heure
      milestone_name: "Logo Refinement",
      version_name: "Final Version",
      is_client: true,
    })
    
    // Commentaires pour le livrable Social Media si créé
    if (deliverableSocialId) {
      commentsToAdd.push({
        id: uuidv4(),
        deliverable_id: deliverableSocialId,
        project_id: projectId,
        user_id: designerId,
        content: "Voici les premiers templates Instagram basés sur la nouvelle identité visuelle.",
        created_at: new Date().toISOString(),
        milestone_name: "Social Media Assets",
        version_name: "First Draft",
        is_client: false,
      })
    }
    
    // Insérer tous les commentaires
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .insert(commentsToAdd)
      .select()
    
    if (commentsError) {
      return NextResponse.json({ error: commentsError.message, details: commentsError }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Livrables et commentaires ajoutés avec succès",
      logoRefinementStep,
      deliverableLogo,
      socialMediaDeliverable,
      comments,
      userIds: {
        designerId,
        clientId
      }
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 })
  }
} 