"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function updateBrandRedesignProject() {
  const supabase = createServerSupabaseClient()

  // ID du projet Brand Redesign existant
  const projectId = "550e8400-e29b-41d4-a716-446655440020"
  
  // IDs des utilisateurs existants
  const designerId = "550e8400-e29b-41d4-a716-446655440001" // Designer
  const clientId = "550e8400-e29b-41d4-a716-446655440002" // Client

  try {
    // Vérifier si le projet existe
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle()

    if (!existingProject) {
      return {
        success: false,
        message: "Le projet Brand Redesign n'existe pas",
      }
    }

    // Récupérer toutes les étapes existantes du projet
    const { data: existingSteps } = await supabase
      .from("project_steps")
      .select("id, title")
      .eq("project_id", projectId)
    
    console.log("Étapes existantes:", existingSteps || [])
    
    // Créer une étape "Logo Refinement" si elle n'existe pas
    let step4Id
    const logoRefinementStep = existingSteps?.find(s => s.title === "Logo Refinement")
    
    if (!logoRefinementStep) {
      step4Id = uuidv4()
      await supabase.from("project_steps").insert([
        {
          id: step4Id,
          project_id: projectId,
          title: "Logo Refinement",
          description: "Affinage du logo sélectionné",
          status: "current",
          order_index: 4,
          due_date: "2025-04-30",
          icon: "Edit",
        }
      ])
    } else {
      step4Id = logoRefinementStep.id
    }
    
    // 1. Ajouter une nouvelle étape au projet
    const newStepId = uuidv4() // UUID valide
    await supabase.from("project_steps").insert([
      {
        id: newStepId,
        project_id: projectId,
        title: "Social Media Assets",
        description: "Création des visuels pour les réseaux sociaux",
        status: "upcoming",
        order_index: 8,
        due_date: "2025-07-15",
        icon: "Share2",
      }
    ])

    // 2. Ajouter des livrables supplémentaires à l'étape 4 (Logo Refinement)
    const deliverable4Id = uuidv4()
    await supabase.from("deliverables").insert([
      {
        id: deliverable4Id,
        step_id: step4Id,
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
      },
    ])

    // 3. Ajouter des livrables à la nouvelle étape (Social Media Assets)
    await supabase.from("deliverables").insert([
      {
        id: uuidv4(),
        step_id: newStepId,
        project_id: projectId,
        title: "Social Media Profile Templates",
        description: "Templates pour profils sur réseaux sociaux",
        file_url: "/placeholder.svg?height=600&width=450&text=Social+Media+Profile+Templates",
        file_name: "social_media_profiles.pdf",
        file_type: "pdf",
        created_by: designerId,
        version_name: "Initial Draft",
        version_number: 1,
        is_latest: true,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ])

    // 4. Ajouter des commentaires aux livrables
    await supabase.from("comments").insert([
      {
        id: uuidv4(),
        deliverable_id: deliverable4Id,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "J'aime beaucoup la palette de couleurs utilisée. Est-ce qu'on pourrait voir une version avec des tons plus froids?",
        created_at: new Date().toISOString(),
        milestone_name: "Logo Refinement",
        version_name: "Color Variations v1",
        is_client: true,
      },
      {
        id: uuidv4(),
        deliverable_id: deliverable4Id,
        project_id: projectId,
        user_id: designerId,
        content: "Bien sûr, je vais préparer une version avec des tons plus froids. Préférez-vous des bleus ou des verts?",
        created_at: new Date(Date.now() + 3600000).toISOString(), // +1 heure
        milestone_name: "Logo Refinement",
        version_name: "Color Variations v1",
        is_client: false,
      },
      {
        id: uuidv4(),
        deliverable_id: deliverable4Id,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "Je pense que des bleus s'accorderaient mieux avec notre image de marque actuelle.",
        created_at: new Date(Date.now() + 7200000).toISOString(), // +2 heures
        milestone_name: "Logo Refinement",
        version_name: "Color Variations v1",
        is_client: true,
      },
    ])

    // 5. Ajouter des fichiers partagés supplémentaires
    await supabase.from("shared_files").insert([
      {
        id: uuidv4(),
        project_id: projectId,
        title: "Inspirations de logos",
        description: "Une collection de logos qui m'ont inspiré",
        file_name: "logo_inspirations.pdf",
        file_type: "pdf",
        file_size: "2.4 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Logo+Inspirations",
        uploaded_by: clientId,
        is_client: true,
        status: "New",
        created_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: projectId,
        title: "Analyse de la concurrence",
        description: "Étude comparative des logos de la concurrence",
        file_name: "competitor_analysis.xlsx",
        file_type: "xlsx",
        file_size: "1.7 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Competitor+Analysis",
        uploaded_by: designerId,
        is_client: false,
        status: "New",
        created_at: new Date().toISOString(),
      },
    ])

    return {
      success: true,
      message: "Le projet Brand Redesign a été mis à jour avec succès",
      projectId,
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet Brand Redesign:", error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du projet",
      error,
    }
  }
} 