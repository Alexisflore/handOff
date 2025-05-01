"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/supabase-storage"

export async function getProjectDetails(projectId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
       *,
       clients (*)
     `)
      .eq("id", projectId)
      .maybeSingle() // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur

    if (projectError) throw projectError

    // Si aucun projet n'est trouvé, retourner null
    if (!project) {
      return null
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
      project,
      client: project.clients,
      steps: stepsWithDeliverables,
      deliverables: deliverablesWithComments,
      comments,
      freelancer: mainFreelancer,
      sharedFiles,
    }
  } catch (error) {
    console.error("Error fetching project details:", error)
    throw error
  }
}

export async function getSharedFiles(projectId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("shared_files")
      .select(`
        *,
        users:uploaded_by (*)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching shared files:", error)
    throw error
  }
}

export async function addComment(
  deliverableId: string,
  userId: string,
  content: string,
  isClient: boolean,
  clientId?: string,
) {
  const supabase = createServerSupabaseClient()

  try {
    // D'abord, récupérer les informations du livrable pour obtenir project_id, milestone_name, etc.
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select(`
        *,
        project_steps (*)
      `)
      .eq("id", deliverableId)
      .single()

    if (deliverableError) throw deliverableError

    // Créer le commentaire
    const { data, error } = await supabase
      .from("comments")
      .insert({
        deliverable_id: deliverableId,
        project_id: deliverable.project_id,
        user_id: userId !== "system" ? userId : null,
        client_id: clientId,
        content,
        is_client: isClient,
        milestone_name: deliverable.project_steps.title,
        version_name: deliverable.version_name,
        is_system_message: userId === "system",
      })
      .select()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error adding comment:", error)
    throw error
  }
}

export async function approveDeliverable(deliverableId: string, clientId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Validation des paramètres
    if (!deliverableId || deliverableId.trim() === "") {
      throw new Error("deliverableId is required");
    }
    
    // Récupérer les informations du livrable
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select(`
        *,
        project_steps (*)
      `)
      .eq("id", deliverableId)
      .single()

    if (deliverableError) throw deliverableError

    // Mettre à jour le statut du livrable
    const { error: updateError } = await supabase
      .from("deliverables")
      .update({ status: "approved", is_latest: true })
      .eq("id", deliverableId)

    if (updateError) throw updateError

    // Mettre à jour le statut de l'étape du projet
    const { error: stepUpdateError } = await supabase
      .from("project_steps")
      .update({ status: "completed" })
      .eq("id", deliverable.step_id)

    if (stepUpdateError) throw stepUpdateError

    // Trouver l'étape suivante et la marquer comme "current"
    const { data: nextStep, error: nextStepError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", deliverable.project_id)
      .gt("order_index", deliverable.project_steps.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .single()

    if (nextStep) {
      const { error: updateNextStepError } = await supabase
        .from("project_steps")
        .update({ status: "current" })
        .eq("id", nextStep.id)

      if (updateNextStepError) throw updateNextStepError
    }

    // Mettre à jour le progrès du projet
    const { data: allSteps, error: allStepsError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", deliverable.project_id)

    if (allStepsError) throw allStepsError

    const completedSteps = allSteps.filter((step) => step.status === "completed").length
    const totalSteps = allSteps.length
    const progress = Math.round((completedSteps / totalSteps) * 100)

    const { error: projectUpdateError } = await supabase
      .from("projects")
      .update({ progress })
      .eq("id", deliverable.project_id)

    if (projectUpdateError) throw projectUpdateError

    // Commentaire supprimé - plus besoin d'ajouter un commentaire à l'approbation

    return { success: true }
  } catch (error) {
    console.error("Error approving deliverable:", error)
    throw error
  }
}

export async function rejectDeliverable(deliverableId: string, clientId: string, feedback: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Validation des paramètres
    if (!deliverableId || deliverableId.trim() === "") {
      throw new Error("deliverableId is required");
    }
    
    if (!feedback || feedback.trim() === "") {
      throw new Error("feedback is required");
    }
    
    
    // Récupérer les informations du livrable pour le commentaire
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select(`
        *,
        project_steps (*)
      `)
      .eq("id", deliverableId)
      .single()

    if (deliverableError) throw deliverableError
    
    // Mettre à jour le statut du livrable
    const { error: updateError } = await supabase
      .from("deliverables")
      .update({ status: "rejected" })
      .eq("id", deliverableId)

    if (updateError) throw updateError

    // Interface pour typer les données du commentaire
    interface CommentData {
      deliverable_id: string;
      project_id: string;
      user_id: string;
      client_id?: string;
      content: string;
      is_client: boolean;
      milestone_name: string;
      version_name: string;
    }
    
    // Ajouter un commentaire avec le feedback
    const commentData: CommentData = {
      deliverable_id: deliverableId,
      project_id: deliverable.project_id,
      user_id: clientId,
      content: feedback,
      is_client: true,
      milestone_name: deliverable.project_steps.title || "Milestone",
      version_name: deliverable.version_name || "Version",
    };
    
    // Si clientId existe et n'est pas vide, l'ajouter au commentaire
    if (clientId && clientId.trim() !== "") {
      commentData.client_id = clientId;
    }
    
    const { error: commentError } = await supabase
      .from("comments")
      .insert(commentData);

    if (commentError) throw commentError

    return { success: true }
  } catch (error) {
    console.error("Error rejecting deliverable:", error)
    throw error
  }
}

export async function uploadSharedFile(
  projectId: string,
  userId: string,
  isClient: boolean,
  clientId: string | null,
  fileData: {
    title: string
    description: string
    file: File
  },
) {
  const supabase = createServerSupabaseClient()

  try {
    // Télécharger le fichier vers Supabase Storage
    const folder = `project-${projectId}`
    const { path, url } = await uploadFileToStorage(fileData.file, "shared-files", folder)

    // Déterminer le type de fichier et la taille
    const fileType = fileData.file.name.split(".").pop() || ""
    const fileSize = `${(fileData.file.size / 1024 / 1024).toFixed(2)} MB`

    // Déterminer si une prévisualisation est disponible
    const isPreviewable = ["jpg", "jpeg", "png", "gif"].includes(fileType.toLowerCase())
    const previewUrl = isPreviewable ? url : undefined

    // Enregistrer les métadonnées du fichier dans la base de données
    const { data, error } = await supabase
      .from("shared_files")
      .insert({
        project_id: projectId,
        title: fileData.title,
        description: fileData.description,
        file_name: fileData.file.name,
        file_type: fileType,
        file_size: fileSize,
        file_url: url,
        storage_path: path,
        preview_url: previewUrl,
        uploaded_by: userId,
        is_client: isClient,
        client_id: clientId,
        status: "New",
      })
      .select()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteSharedFile(fileId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Récupérer les informations du fichier
    const { data: file, error: fetchError } = await supabase
      .from("shared_files")
      .select("storage_path")
      .eq("id", fileId)
      .single()

    if (fetchError) throw fetchError

    // Supprimer le fichier du stockage si un chemin de stockage est disponible
    if (file.storage_path) {
      await deleteFileFromStorage(file.storage_path)
    }

    // Supprimer l'entrée de la base de données
    const { error } = await supabase.from("shared_files").delete().eq("id", fileId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

export async function getProjectStats(projectId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (projectError) throw projectError

    // Récupérer les étapes du projet
    const { data: steps, error: stepsError } = await supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", projectId)

    if (stepsError) throw stepsError

    // Récupérer les livrables
    const { data: deliverables, error: deliverablesError } = await supabase
      .from("deliverables")
      .select("*")
      .eq("project_id", projectId)

    if (deliverablesError) throw deliverablesError

    // Récupérer les commentaires
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", projectId)

    if (commentsError) throw commentsError

    // Récupérer les fichiers partagés
    const { data: files, error: filesError } = await supabase
      .from("shared_files")
      .select("*")
      .eq("project_id", projectId)

    if (filesError) throw filesError

    // Calculer les statistiques
    const totalSteps = steps.length
    const completedSteps = steps.filter((step) => step.status === "completed").length
    const totalDeliverables = deliverables.length
    const approvedDeliverables = deliverables.filter((d) => d.status === "approved").length
    const rejectedDeliverables = deliverables.filter((d) => d.status === "rejected").length
    const totalComments = comments.length
    const clientComments = comments.filter((c) => c.is_client).length
    const designerComments = comments.filter((c) => !c.is_client).length
    const totalFiles = files.length
    const clientFiles = files.filter((f) => f.is_client).length
    const designerFiles = files.filter((f) => !f.is_client).length

    // Calculer le temps restant
    const dueDate = new Date(project.end_date)
    const today = new Date()
    const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

    return {
      progress: project.progress,
      totalSteps,
      completedSteps,
      totalDeliverables,
      approvedDeliverables,
      rejectedDeliverables,
      totalComments,
      clientComments,
      designerComments,
      totalFiles,
      clientFiles,
      designerFiles,
      daysLeft,
      startDate: project.start_date,
      endDate: project.end_date,
    }
  } catch (error) {
    console.error("Error fetching project stats:", error)
    throw error
  }
}
