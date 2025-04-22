"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

// Action serveur pour récupérer tous les projets
export async function getProjectsAction() {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        clients (*)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Erreur getProjectsAction:", error)
    return { data: [], error: String(error) }
  }
}

// Action serveur pour récupérer un projet par ID
export async function getProjectByIdAction(id: string) {
  if (!id || id === "undefined" || id === "[id]") {
    return { data: null, error: "ID invalide" }
  }
  
  try {
    const supabase = createServerSupabaseClient()
    
    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        clients (*)
      `)
      .eq("id", id)
      .maybeSingle()

    if (projectError) throw projectError
    
    if (!project) {
      return { data: null, error: "Projet non trouvé" }
    }

    return { data: project, error: null }
  } catch (error) {
    console.error("Erreur getProjectByIdAction:", error)
    return { data: null, error: String(error) }
  }
}

// Action serveur pour récupérer tous les détails d'un projet
export async function getProjectDetailsAction(projectId: string) {
  console.log("Fetching project details for ID:", projectId, "at:", new Date().toISOString());
  
  if (!projectId || projectId === "undefined" || projectId === "[id]") {
    return { data: null, error: "ID invalide" }
  }
  
  try {
    const supabase = createServerSupabaseClient()

    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
       *,
       clients (*)
     `)
      .eq("id", projectId)
      .maybeSingle()

    if (projectError) throw projectError

    // Si aucun projet n'est trouvé, retourner null
    if (!project) {
      return { data: null, error: "Projet non trouvé" }
    }

    // Récupérer les étapes du projet
    const { data: steps, error: stepsError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true })

    if (stepsError) throw stepsError

    // Récupérer les livrables pour chaque étape
    const stepIds = steps.map((step) => step.id)
    const { data: deliverables, error: deliverablesError } = await supabase
      .from("deliverables")
      .select("*")
      .in("step_id", stepIds)
      .order("version_number", { ascending: true })

    if (deliverablesError) throw deliverablesError

    // Récupérer les commentaires pour les livrables
    const deliverableIds = deliverables.map((deliverable) => deliverable.id)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(`
       *,
       users (*)
     `)
      .in("deliverable_id", deliverableIds)
      .order("created_at", { ascending: true })

    if (commentsError) throw commentsError

    // Récupérer les freelancers associés au projet
    const { data: projectFreelancers, error: freelancersError } = await supabase
      .from("project_freelancers")
      .select(`
       *,
       freelancers (
         *,
         users (*)
       )
     `)
      .eq("project_id", projectId)

    if (freelancersError) throw freelancersError

    // Récupérer les fichiers partagés
    const { data: sharedFiles, error: filesError } = await supabase
      .from("shared_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (filesError) throw filesError

    // Organiser les livrables par étape
    const stepsWithDeliverables = steps.map((step) => {
      const stepDeliverables = deliverables.filter((d) => d.step_id === step.id)
      return {
        ...step,
        versions: stepDeliverables,
      }
    })

    // S'assurer que chaque étape a son statut correctement défini et au moins une version vide
    const normalizedSteps = stepsWithDeliverables.map((step, index) => {
      // S'assurer qu'il y a toujours un statut
      const status = step.status || (index === 0 ? "current" : "pending");
      
      // S'assurer que versions est toujours un tableau, même vide
      const versions = Array.isArray(step.versions) ? step.versions : [];
      
      return {
        ...step,
        status,
        versions
      };
    });

    // Si aucune étape n'existe, créer une étape factice
    const finalSteps = normalizedSteps.length > 0 ? normalizedSteps : [
      {
        id: "default-step-id",
        title: "Étape initiale",
        description: "Aucune étape n'a encore été créée pour ce projet",
        project_id: projectId,
        order_index: 0,
        status: "current",
        versions: []
      }
    ];

    // Organiser les commentaires par livrable
    const deliverablesWithComments = deliverables.map((deliverable) => {
      const deliverableComments = comments.filter((c) => c.deliverable_id === deliverable.id)
      return {
        ...deliverable,
        comments: deliverableComments,
      }
    })

    // Extraire le freelancer principal (premier de la liste)
    const mainFreelancer = projectFreelancers.length > 0 ? projectFreelancers[0].freelancers : null

    return {
      data: {
        project,
        client: project.clients,
        steps: finalSteps,
        deliverables: deliverablesWithComments,
        comments,
        freelancer: mainFreelancer,
        sharedFiles,
      },
      error: null
    }
  } catch (error) {
    console.error("Error fetching project details:", error)
    return { data: null, error: String(error) }
  }
}

// Action pour vérifier l'identité de l'utilisateur connecté
export async function checkUserIdentity() {
  const supabase = createServerSupabaseClient()
  
  try {
    // Récupérer la session de l'utilisateur connecté
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data.session) {
      return { user: null, isDesigner: false, error: "Non connecté" }
    }
    
    // Récupérer les informations de l'utilisateur depuis la base de données
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.session.user.id)
      .maybeSingle()
      
    if (userError) {
      return { user: null, isDesigner: false, error: userError.message }
    }
    
    // Vérifier si l'utilisateur est un designer (a une entrée dans la table freelancers)
    const { data: designerData, error: designerError } = await supabase
      .from("freelancers")
      .select("*")
      .eq("user_id", data.session.user.id)
      .maybeSingle()
    
    return { 
      user: userData,
      isDesigner: designerData !== null,
      error: null
    }
  } catch (error) {
    console.error("Error checking user identity:", error)
    return { user: null, isDesigner: false, error: String(error) }
  }
} 