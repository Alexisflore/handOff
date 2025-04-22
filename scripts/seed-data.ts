"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export async function seedDatabase() {
  const supabase = createServerSupabaseClient()

  // Générer des UUIDs pour les relations
  const userId1 = "550e8400-e29b-41d4-a716-446655440000"
  const userId2 = "550e8400-e29b-41d4-a716-446655440001"
  const clientId = "550e8400-e29b-41d4-a716-446655440002"
  const projectId = "550e8400-e29b-41d4-a716-446655440003"
  const step1Id = "550e8400-e29b-41d4-a716-446655440004"
  const step2Id = "550e8400-e29b-41d4-a716-446655440005"
  const step3Id = "550e8400-e29b-41d4-a716-446655440006"
  const deliverable1Id = "550e8400-e29b-41d4-a716-446655440007"
  const deliverable2Id = "550e8400-e29b-41d4-a716-446655440008"
  const deliverable3Id = "550e8400-e29b-41d4-a716-446655440009"
  const freelancerId = "550e8400-e29b-41d4-a716-446655440010"

  try {
    // 1. Insérer des utilisateurs
    await supabase.from("users").upsert(
      [
        {
          id: userId1,
          email: "designer@example.com",
          full_name: "Alex Morgan",
          avatar_url: "/placeholder.svg?height=64&width=64&text=AM",
        },
        {
          id: userId2,
          email: "client@example.com",
          full_name: "John Smith",
          avatar_url: "/placeholder.svg?height=64&width=64&text=JS",
        },
      ],
      { onConflict: "id" },
    )

    // 2. Insérer un client
    await supabase.from("clients").upsert(
      [
        {
          id: clientId,
          name: "John Smith",
          company: "Acme Corporation",
          email: "john@acme.com",
          phone: "+1 (555) 123-4567",
          created_by: userId1,
          logo_url: "/placeholder.svg?height=48&width=48&text=AC",
          initials: "AC",
          role: "Marketing Director",
        },
      ],
      { onConflict: "id" },
    )

    // 3. Insérer un freelancer
    await supabase.from("freelancers").upsert(
      [
        {
          id: freelancerId,
          user_id: userId1,
          company: "Studio Creative",
          role: "UI/UX Designer",
          logo_url: "/placeholder.svg?height=32&width=32&text=SC",
          initials: "AM",
          phone: "+1 (555) 123-4567",
        },
      ],
      { onConflict: "id" },
    )

    // 4. Insérer un projet
    await supabase.from("projects").upsert(
      [
        {
          id: projectId,
          title: "Website Redesign",
          internal_name: "ACME Website Redesign",
          name_alias: "ACME-2023",
          status: "in_progress",
          client_id: clientId,
          created_by: userId1,
          start_date: "2025-04-01",
          end_date: "2025-05-15",
          color_theme: "teal",
          project_number: "2023-089",
          progress: 60,
        },
      ],
      { onConflict: "id" },
    )

    // 5. Associer le freelancer au projet
    await supabase.from("project_freelancers").upsert(
      [
        {
          project_id: projectId,
          freelancer_id: freelancerId,
          role: "Lead Designer",
        },
      ],
      { onConflict: ["project_id", "freelancer_id"] },
    )

    // 6. Insérer les étapes du projet
    await supabase.from("project_steps").upsert(
      [
        {
          id: step1Id,
          project_id: projectId,
          title: "Brief",
          description: "Project requirements and goals",
          status: "completed",
          order_index: 1,
          due_date: "2025-04-05",
          icon: "FileText",
        },
        {
          id: step2Id,
          project_id: projectId,
          title: "Wireframes",
          description: "Low-fidelity layouts and user flows",
          status: "completed",
          order_index: 2,
          due_date: "2025-04-10",
          icon: "Layout",
        },
        {
          id: step3Id,
          project_id: projectId,
          title: "Design",
          description: "High-fidelity visual designs",
          status: "current",
          order_index: 3,
          due_date: "2025-04-20",
          icon: "Palette",
        },
        {
          project_id: projectId,
          title: "Development",
          description: "Implementation and coding",
          status: "upcoming",
          order_index: 4,
          due_date: "2025-05-05",
        },
        {
          project_id: projectId,
          title: "Launch",
          description: "Deployment and go-live",
          status: "upcoming",
          order_index: 5,
          due_date: "2025-05-15",
        },
      ],
      { onConflict: "id" },
    )

    // 7. Insérer les livrables
    await supabase.from("deliverables").upsert(
      [
        {
          id: deliverable1Id,
          step_id: step1Id,
          project_id: projectId,
          title: "Initial Brief",
          description: "Initial project brief with requirements and goals",
          file_url: "/placeholder.svg?height=600&width=450&text=Project+Brief+Document",
          file_name: "project_brief.pdf",
          file_type: "pdf",
          created_by: userId1,
          version_name: "Initial Brief",
          version_number: 1,
          is_latest: true,
          status: "approved",
        },
        {
          id: deliverable2Id,
          step_id: step2Id,
          project_id: projectId,
          title: "First Draft",
          description: "Initial wireframes for homepage and key pages",
          file_url: "/placeholder.svg?height=600&width=450&text=Wireframes+First+Draft",
          file_name: "wireframes_v1.jpg",
          file_type: "image",
          created_by: userId1,
          version_name: "First Draft",
          version_number: 1,
          is_latest: false,
          status: "approved",
        },
        {
          step_id: step2Id,
          project_id: projectId,
          title: "Revised Draft",
          description: "Revised wireframes based on feedback",
          file_url: "/placeholder.svg?height=600&width=450&text=Wireframes+Revised+Draft",
          file_name: "wireframes_v2.jpg",
          file_type: "image",
          created_by: userId1,
          version_name: "Revised Draft",
          version_number: 2,
          is_latest: true,
          status: "approved",
        },
        {
          step_id: step3Id,
          project_id: projectId,
          title: "Design Concept",
          description: "Initial design concept based on approved wireframes",
          file_url: "/placeholder.svg?height=600&width=450&text=Design+Version+1.0",
          file_name: "design_v1.jpg",
          file_type: "image",
          created_by: userId1,
          version_name: "Version 1.0",
          version_number: 1,
          is_latest: false,
          status: "approved",
        },
        {
          step_id: step3Id,
          project_id: projectId,
          title: "Revised Design",
          description: "Revised design with updated color palette",
          file_url: "/placeholder.svg?height=600&width=450&text=Design+Version+2.0",
          file_name: "design_v2.jpg",
          file_type: "image",
          created_by: userId1,
          version_name: "Version 2.0",
          version_number: 2,
          is_latest: false,
          status: "approved",
        },
        {
          id: deliverable3Id,
          step_id: step3Id,
          project_id: projectId,
          title: "Final Design",
          description: "Final design with enhanced call-to-action elements",
          file_url: "/placeholder.svg?height=600&width=450&text=Design+Version+3.0",
          file_name: "design_v3.jpg",
          file_type: "image",
          created_by: userId1,
          version_name: "Version 3.0",
          version_number: 3,
          is_latest: true,
          status: "pending",
        },
      ],
      { onConflict: "id" },
    )

    // 8. Insérer des commentaires
    await supabase.from("comments").upsert([
      {
        deliverable_id: deliverable1Id,
        project_id: projectId,
        user_id: userId1,
        content: "Here's the initial brief document based on our discovery meeting.",
        created_at: "2025-04-01T10:23:00Z",
        milestone_name: "Brief",
        version_name: "Initial Brief",
        is_client: false,
      },
      {
        deliverable_id: deliverable1Id,
        project_id: projectId,
        user_id: userId2,
        client_id: clientId,
        content: "Thanks for the detailed brief. This looks good to proceed with.",
        created_at: "2025-04-01T11:45:00Z",
        milestone_name: "Brief",
        version_name: "Initial Brief",
        is_client: true,
      },
      {
        deliverable_id: deliverable2Id,
        project_id: projectId,
        user_id: userId1,
        content: "Here are the initial wireframes for your review.",
        created_at: "2025-04-05T09:15:00Z",
        milestone_name: "Wireframes",
        version_name: "First Draft",
        is_client: false,
      },
      {
        deliverable_id: deliverable2Id,
        project_id: projectId,
        user_id: userId2,
        client_id: clientId,
        content: "The navigation structure needs some adjustments. Can we make the main menu more prominent?",
        created_at: "2025-04-05T14:30:00Z",
        milestone_name: "Wireframes",
        version_name: "First Draft",
        is_client: true,
      },
      {
        deliverable_id: deliverable3Id,
        project_id: projectId,
        user_id: userId1,
        content: "Here's the final design with enhanced call-to-action elements.",
        created_at: "2025-04-15T10:23:00Z",
        milestone_name: "Design",
        version_name: "Version 3.0",
        is_client: false,
      },
      {
        deliverable_id: deliverable3Id,
        project_id: projectId,
        user_id: userId2,
        client_id: clientId,
        content: "I like the new header design, but can we make the call-to-action button more prominent?",
        created_at: "2025-04-15T11:45:00Z",
        milestone_name: "Design",
        version_name: "Version 3.0",
        is_client: true,
      },
    ])

    // 9. Insérer des fichiers partagés
    await supabase.from("shared_files").upsert([
      {
        project_id: projectId,
        title: "Feedback on Homepage",
        description: "My thoughts on the current design",
        file_name: "homepage_feedback.pdf",
        file_type: "pdf",
        file_size: "1.2 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Homepage+Feedback",
        uploaded_by: userId2,
        is_client: true,
        status: "Viewed",
        created_at: "2025-04-10T00:00:00Z",
      },
      {
        project_id: projectId,
        title: "Logo Alternatives",
        description: "Some ideas for the logo",
        file_name: "logo_alternatives.zip",
        file_type: "zip",
        file_size: "4.5 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Logo+Alternatives",
        uploaded_by: userId1,
        is_client: false,
        status: "New",
        created_at: "2025-04-08T00:00:00Z",
      },
    ])

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Error seeding database", error }
  }
}
