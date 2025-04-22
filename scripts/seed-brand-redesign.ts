"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export async function seedBrandRedesignProject() {
  const supabase = createServerSupabaseClient()

  // IDs pour les relations
  const clientId = "550e8400-e29b-41d4-a716-446655440002" // ID du client existant
  const designerId = "550e8400-e29b-41d4-a716-446655440001" // ID du designer existant
  const freelancerId = "550e8400-e29b-41d4-a716-446655440010" // ID du freelancer existant
  const projectId = "550e8400-e29b-41d4-a716-446655440020" // Nouvel ID pour le projet Brand Redesign

  try {
    // Vérifier si le projet existe déjà
    const { data: existingProject } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle()

    const forceUpdate = true; // Changer à false pour ne pas mettre à jour un projet existant

    if (existingProject && !forceUpdate) {
      return {
        success: true,
        message: "Le projet Brand Redesign existe déjà",
        projectId,
      }
    }

    // Vérifier si le client existe, sinon le créer
    const { data: existingClient } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle()

    if (!existingClient) {
      await supabase.from("clients").upsert([
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
        },
      ])
    }

    // Vérifier si le freelancer existe, sinon le créer
    const { data: existingFreelancer } = await supabase
      .from("freelancers")
      .select("id")
      .eq("id", freelancerId)
      .maybeSingle()

    if (!existingFreelancer) {
      await supabase.from("freelancers").upsert([
        {
          id: freelancerId,
          user_id: designerId,
          company: "Studio Creative",
          role: "UI/UX Designer",
          logo_url: "/placeholder.svg?height=32&width=32&text=SC",
          initials: "AM",
          phone: "+1 (555) 123-4567",
        },
      ])
    }

    // 1. Créer le projet Brand Redesign
    await supabase.from("projects").upsert(
      [
        {
          id: projectId,
          title: "Brand Redesign",
          internal_name: "ACME Brand Redesign 2025",
          name_alias: "ACME-BRAND-2025",
          status: "in_progress",
          client_id: clientId,
          created_by: designerId,
          start_date: "2025-03-01",
          end_date: "2025-06-30",
          color_theme: "indigo",
          project_number: "2025-042",
          progress: 65,
          description: "Refonte complète de l'identité visuelle d'ACME Corporation pour 2025",
        },
      ],
      { onConflict: "id" },
    )

    // 2. Associer le freelancer au projet
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

    // 3. Créer les étapes du projet (7 étapes au total)
    const steps = [
      {
        id: `${projectId}-step-1`,
        project_id: projectId,
        title: "Discovery",
        description: "Analyse des besoins et recherche",
        status: "completed",
        order_index: 1,
        due_date: "2025-03-15",
        icon: "Search",
      },
      {
        id: `${projectId}-step-2`,
        project_id: projectId,
        title: "Brand Strategy",
        description: "Définition de la stratégie de marque",
        status: "completed",
        order_index: 2,
        due_date: "2025-03-31",
        icon: "Lightbulb",
      },
      {
        id: `${projectId}-step-3`,
        project_id: projectId,
        title: "Logo Concepts",
        description: "Création des concepts de logo",
        status: "completed",
        order_index: 3,
        due_date: "2025-04-15",
        icon: "Palette",
      },
      {
        id: `${projectId}-step-4`,
        project_id: projectId,
        title: "Logo Refinement",
        description: "Affinage du logo sélectionné",
        status: "current",
        order_index: 4,
        due_date: "2025-04-30",
        icon: "Edit",
      },
      {
        id: `${projectId}-step-5`,
        project_id: projectId,
        title: "Brand Guidelines",
        description: "Création du guide de marque",
        status: "upcoming",
        order_index: 5,
        due_date: "2025-05-15",
        icon: "Book",
      },
      {
        id: `${projectId}-step-6`,
        project_id: projectId,
        title: "Collateral Design",
        description: "Conception des supports marketing",
        status: "upcoming",
        order_index: 6,
        due_date: "2025-06-15",
        icon: "FileText",
      },
      {
        id: `${projectId}-step-7`,
        project_id: projectId,
        title: "Delivery",
        description: "Livraison finale des fichiers",
        status: "upcoming",
        order_index: 7,
        due_date: "2025-06-30",
        icon: "Package",
      },
    ]

    await supabase.from("project_steps").upsert(steps, { onConflict: "id" })

    // 4. Créer les livrables pour chaque étape
    // Étape 1: Discovery
    await supabase.from("deliverables").upsert(
      [
        {
          id: `${projectId}-deliverable-1-1`,
          step_id: `${projectId}-step-1`,
          project_id: projectId,
          title: "Brand Audit",
          description: "Analyse de l'identité visuelle actuelle et des concurrents",
          file_url: "/placeholder.svg?height=600&width=450&text=Brand+Audit+Report",
          file_name: "brand_audit.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Brand Audit v1",
          version_number: 1,
          is_latest: true,
          status: "approved",
          created_at: "2025-03-05T10:00:00Z",
        },
        {
          id: `${projectId}-deliverable-1-2`,
          step_id: `${projectId}-step-1`,
          project_id: projectId,
          title: "Market Research",
          description: "Étude de marché et analyse des tendances",
          file_url: "/placeholder.svg?height=600&width=450&text=Market+Research+Report",
          file_name: "market_research.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Market Research v1",
          version_number: 1,
          is_latest: true,
          status: "approved",
          created_at: "2025-03-10T14:30:00Z",
        },
      ],
      { onConflict: "id" },
    )

    // Étape 2: Brand Strategy
    await supabase.from("deliverables").upsert(
      [
        {
          id: `${projectId}-deliverable-2-1`,
          step_id: `${projectId}-step-2`,
          project_id: projectId,
          title: "Brand Positioning",
          description: "Document de positionnement de la marque",
          file_url: "/placeholder.svg?height=600&width=450&text=Brand+Positioning+Document",
          file_name: "brand_positioning.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Brand Positioning v1",
          version_number: 1,
          is_latest: false,
          status: "rejected",
          created_at: "2025-03-20T09:15:00Z",
        },
        {
          id: `${projectId}-deliverable-2-2`,
          step_id: `${projectId}-step-2`,
          project_id: projectId,
          title: "Brand Positioning",
          description: "Document de positionnement de la marque révisé",
          file_url: "/placeholder.svg?height=600&width=450&text=Brand+Positioning+Document+Revised",
          file_name: "brand_positioning_v2.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Brand Positioning v2",
          version_number: 2,
          is_latest: true,
          status: "approved",
          created_at: "2025-03-25T11:45:00Z",
        },
        {
          id: `${projectId}-deliverable-2-3`,
          step_id: `${projectId}-step-2`,
          project_id: projectId,
          title: "Brand Voice",
          description: "Définition du ton et de la voix de la marque",
          file_url: "/placeholder.svg?height=600&width=450&text=Brand+Voice+Guidelines",
          file_name: "brand_voice.pdf",
          file_type: "pdf",
          created_by: designerId,
          version_name: "Brand Voice v1",
          version_number: 1,
          is_latest: true,
          status: "approved",
          created_at: "2025-03-28T15:20:00Z",
        },
      ],
      { onConflict: "id" },
    )

    // Étape 3: Logo Concepts
    await supabase.from("deliverables").upsert(
      [
        {
          id: `${projectId}-deliverable-3-1`,
          step_id: `${projectId}-step-3`,
          project_id: projectId,
          title: "Logo Concepts - Round 1",
          description: "Première série de concepts de logo",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Concepts+Round+1",
          file_name: "logo_concepts_r1.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Concepts R1",
          version_number: 1,
          is_latest: false,
          status: "rejected",
          created_at: "2025-04-05T10:30:00Z",
        },
        {
          id: `${projectId}-deliverable-3-2`,
          step_id: `${projectId}-step-3`,
          project_id: projectId,
          title: "Logo Concepts - Round 2",
          description: "Deuxième série de concepts de logo",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Concepts+Round+2",
          file_name: "logo_concepts_r2.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Concepts R2",
          version_number: 2,
          is_latest: false,
          status: "rejected",
          created_at: "2025-04-08T14:15:00Z",
        },
        {
          id: `${projectId}-deliverable-3-3`,
          step_id: `${projectId}-step-3`,
          project_id: projectId,
          title: "Logo Concepts - Round 3",
          description: "Troisième série de concepts de logo",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Concepts+Round+3",
          file_name: "logo_concepts_r3.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Concepts R3",
          version_number: 3,
          is_latest: true,
          status: "approved",
          created_at: "2025-04-12T11:00:00Z",
        },
      ],
      { onConflict: "id" },
    )

    // Étape 4: Logo Refinement
    await supabase.from("deliverables").upsert(
      [
        {
          id: `${projectId}-deliverable-4-1`,
          step_id: `${projectId}-step-4`,
          project_id: projectId,
          title: "Logo Refinement - Version 1",
          description: "Première version du logo affiné",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Refinement+V1",
          file_name: "logo_refinement_v1.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Refinement V1",
          version_number: 1,
          is_latest: false,
          status: "rejected",
          created_at: "2025-04-18T09:45:00Z",
        },
        {
          id: `${projectId}-deliverable-4-2`,
          step_id: `${projectId}-step-4`,
          project_id: projectId,
          title: "Logo Refinement - Version 2",
          description: "Deuxième version du logo affiné",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Refinement+V2",
          file_name: "logo_refinement_v2.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Refinement V2",
          version_number: 2,
          is_latest: true,
          status: "pending",
          created_at: "2025-04-22T15:30:00Z",
        },
        {
          id: `${projectId}-deliverable-4-3`,
          step_id: `${projectId}-step-4`,
          project_id: projectId,
          title: "Logo Color Variations",
          description: "Variations de couleurs pour le logo",
          file_url: "/placeholder.svg?height=600&width=450&text=Logo+Color+Variations",
          file_name: "logo_colors.jpg",
          file_type: "image",
          created_by: designerId,
          version_name: "Logo Colors V1",
          version_number: 1,
          is_latest: true,
          status: "pending",
          created_at: "2025-04-25T13:15:00Z",
        },
      ],
      { onConflict: "id" },
    )

    // 5. Créer des commentaires pour les livrables
    const comments = [
      // Commentaires pour Brand Audit
      {
        deliverable_id: `${projectId}-deliverable-1-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici l'audit de marque initial basé sur notre analyse de votre identité visuelle actuelle.",
        created_at: "2025-03-05T10:05:00Z",
        milestone_name: "Discovery",
        version_name: "Brand Audit v1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-1-1`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "Merci pour cette analyse détaillée. C'est exactement ce que nous recherchions.",
        created_at: "2025-03-06T09:30:00Z",
        milestone_name: "Discovery",
        version_name: "Brand Audit v1",
        is_client: true,
      },

      // Commentaires pour Market Research
      {
        deliverable_id: `${projectId}-deliverable-1-2`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici l'étude de marché complète avec l'analyse des tendances actuelles dans votre secteur.",
        created_at: "2025-03-10T14:35:00Z",
        milestone_name: "Discovery",
        version_name: "Market Research v1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-1-2`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "Très instructif. J'apprécie particulièrement l'analyse des concurrents.",
        created_at: "2025-03-11T10:15:00Z",
        milestone_name: "Discovery",
        version_name: "Market Research v1",
        is_client: true,
      },

      // Commentaires pour Brand Positioning v1 (rejeté)
      {
        deliverable_id: `${projectId}-deliverable-2-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici notre proposition de positionnement de marque basée sur les discussions précédentes.",
        created_at: "2025-03-20T09:20:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Positioning v1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-2-1`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "Je pense que nous devons revoir certains aspects. Notre cible principale n'est pas suffisamment mise en avant.",
        created_at: "2025-03-21T11:00:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Positioning v1",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-2-1`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Compris. Nous allons retravailler le document en mettant davantage l'accent sur votre cible principale.",
        created_at: "2025-03-21T14:45:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Positioning v1",
        is_client: false,
      },

      // Commentaires pour Brand Positioning v2 (approuvé)
      {
        deliverable_id: `${projectId}-deliverable-2-2`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Voici la version révisée du positionnement de marque avec un focus plus important sur votre cible principale.",
        created_at: "2025-03-25T11:50:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Positioning v2",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-2-2`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "C'est beaucoup mieux ! Le positionnement est maintenant parfaitement aligné avec notre vision.",
        created_at: "2025-03-26T09:15:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Positioning v2",
        is_client: true,
      },

      // Commentaires pour Brand Voice
      {
        deliverable_id: `${projectId}-deliverable-2-3`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici notre proposition pour la voix et le ton de votre marque.",
        created_at: "2025-03-28T15:25:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Voice v1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-2-3`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content: "Parfait ! Cela capture exactement comment nous voulons communiquer avec notre audience.",
        created_at: "2025-03-29T10:30:00Z",
        milestone_name: "Brand Strategy",
        version_name: "Brand Voice v1",
        is_client: true,
      },

      // Commentaires pour Logo Concepts - Round 1 (rejeté)
      {
        deliverable_id: `${projectId}-deliverable-3-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici notre première série de concepts de logo pour votre nouvelle identité.",
        created_at: "2025-04-05T10:35:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-1`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "Merci pour ces propositions. Cependant, aucune ne semble vraiment capturer l'essence de notre marque. Pouvez-vous explorer d'autres directions ?",
        created_at: "2025-04-06T14:20:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R1",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Bien sûr, nous allons explorer de nouvelles directions créatives.",
        created_at: "2025-04-06T16:45:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R1",
        is_client: false,
      },

      // Commentaires pour Logo Concepts - Round 2 (rejeté)
      {
        deliverable_id: `${projectId}-deliverable-3-2`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici une nouvelle série de concepts de logo avec des approches différentes.",
        created_at: "2025-04-08T14:20:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R2",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-2`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "J'aime beaucoup plus cette direction ! Le concept #3 est particulièrement intéressant. Pouvez-vous l'explorer davantage ?",
        created_at: "2025-04-09T11:30:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R2",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-2`,
        project_id: projectId,
        user_id: designerId,
        content: "Excellent ! Nous allons développer davantage le concept #3 dans la prochaine itération.",
        created_at: "2025-04-09T13:15:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R2",
        is_client: false,
      },

      // Commentaires pour Logo Concepts - Round 3 (approuvé)
      {
        deliverable_id: `${projectId}-deliverable-3-3`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Voici la troisième série de concepts, avec plusieurs variations basées sur le concept #3 que vous avez apprécié.",
        created_at: "2025-04-12T11:05:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R3",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-3`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "Ces concepts sont excellents ! J'adore particulièrement la variation A du concept #3. C'est exactement ce que nous recherchions.",
        created_at: "2025-04-13T09:45:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R3",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-3-3`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Parfait ! Nous allons maintenant passer à l'étape d'affinage du logo en nous concentrant sur la variation A.",
        created_at: "2025-04-13T14:30:00Z",
        milestone_name: "Logo Concepts",
        version_name: "Logo Concepts R3",
        is_client: false,
      },

      // Commentaires pour Logo Refinement - Version 1 (rejeté)
      {
        deliverable_id: `${projectId}-deliverable-4-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Voici la première version affinée du logo basée sur la variation A que vous avez sélectionnée.",
        created_at: "2025-04-18T09:50:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-1`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "Le logo prend forme, mais les proportions semblent un peu déséquilibrées. Pouvez-vous ajuster le rapport entre le symbole et le texte ?",
        created_at: "2025-04-19T11:20:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V1",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-1`,
        project_id: projectId,
        user_id: designerId,
        content: "Bien noté. Nous allons retravailler les proportions pour un meilleur équilibre visuel.",
        created_at: "2025-04-19T14:05:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V1",
        is_client: false,
      },

      // Commentaires pour Logo Refinement - Version 2 (en attente)
      {
        deliverable_id: `${projectId}-deliverable-4-2`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Voici la version révisée avec des proportions ajustées entre le symbole et le texte. Nous avons également affiné certains détails du symbole.",
        created_at: "2025-04-22T15:35:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V2",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-2`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "C'est beaucoup mieux ! J'aime vraiment la direction. Pouvez-vous nous montrer quelques options de couleurs pour voir comment le logo fonctionnerait dans notre palette ?",
        created_at: "2025-04-23T10:15:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V2",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-2`,
        project_id: projectId,
        user_id: designerId,
        content: "Bien sûr ! Nous allons préparer plusieurs variations de couleurs pour vous les présenter.",
        created_at: "2025-04-23T11:30:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Refinement V2",
        is_client: false,
      },

      // Commentaires pour Logo Color Variations (en attente)
      {
        deliverable_id: `${projectId}-deliverable-4-3`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Voici plusieurs variations de couleurs pour le logo. Nous avons exploré différentes palettes qui correspondent à votre positionnement de marque.",
        created_at: "2025-04-25T13:20:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Colors V1",
        is_client: false,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-3`,
        project_id: projectId,
        user_id: clientId,
        client_id: clientId,
        content:
          "Merci pour ces options ! J'hésite entre la variation 2 (bleu/vert) et la variation 4 (violet/orange). Pouvons-nous voir ces deux options appliquées sur quelques supports ?",
        created_at: "2025-04-26T09:45:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Colors V1",
        is_client: true,
      },
      {
        deliverable_id: `${projectId}-deliverable-4-3`,
        project_id: projectId,
        user_id: designerId,
        content:
          "Bien sûr ! Nous allons préparer des maquettes avec ces deux options de couleurs appliquées sur différents supports.",
        created_at: "2025-04-26T11:10:00Z",
        milestone_name: "Logo Refinement",
        version_name: "Logo Colors V1",
        is_client: false,
      },
    ]

    await supabase.from("comments").upsert(comments)

    // 6. Créer des fichiers partagés
    const sharedFiles = [
      {
        project_id: projectId,
        title: "Inspiration Board",
        description: "Planche d'inspiration pour la direction créative",
        file_name: "inspiration_board.jpg",
        file_type: "jpg",
        file_size: "3.2 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Inspiration+Board",
        storage_path: `project-${projectId}/inspiration_board.jpg`,
        uploaded_by: clientId,
        is_client: true,
        status: "Viewed",
        created_at: "2025-03-03T14:30:00Z",
      },
      {
        project_id: projectId,
        title: "Current Brand Assets",
        description: "Archive des éléments de marque actuels",
        file_name: "current_brand_assets.zip",
        file_type: "zip",
        file_size: "8.5 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Current+Brand+Assets",
        storage_path: `project-${projectId}/current_brand_assets.zip`,
        uploaded_by: clientId,
        is_client: true,
        status: "Viewed",
        created_at: "2025-03-04T10:15:00Z",
      },
      {
        project_id: projectId,
        title: "Competitor Logos",
        description: "Compilation des logos des principaux concurrents",
        file_name: "competitor_logos.pdf",
        file_type: "pdf",
        file_size: "2.1 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Competitor+Logos",
        storage_path: `project-${projectId}/competitor_logos.pdf`,
        uploaded_by: designerId,
        is_client: false,
        status: "New",
        created_at: "2025-03-08T09:30:00Z",
      },
      {
        project_id: projectId,
        title: "Brand Mood Board",
        description: "Planche d'ambiance pour la nouvelle identité",
        file_name: "brand_mood_board.jpg",
        file_type: "jpg",
        file_size: "4.3 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Brand+Mood+Board",
        storage_path: `project-${projectId}/brand_mood_board.jpg`,
        uploaded_by: designerId,
        is_client: false,
        status: "Viewed",
        created_at: "2025-03-18T15:45:00Z",
      },
      {
        project_id: projectId,
        title: "Logo Feedback",
        description: "Retours détaillés sur les concepts de logo",
        file_name: "logo_feedback.docx",
        file_type: "docx",
        file_size: "1.8 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Logo+Feedback",
        storage_path: `project-${projectId}/logo_feedback.docx`,
        uploaded_by: clientId,
        is_client: true,
        status: "New",
        created_at: "2025-04-10T11:20:00Z",
      },
      {
        project_id: projectId,
        title: "Color Palette Research",
        description: "Recherches sur les palettes de couleurs pour la nouvelle identité",
        file_name: "color_palette_research.pdf",
        file_type: "pdf",
        file_size: "3.5 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Color+Palette+Research",
        storage_path: `project-${projectId}/color_palette_research.pdf`,
        uploaded_by: designerId,
        is_client: false,
        status: "Viewed",
        created_at: "2025-04-20T14:10:00Z",
      },
      {
        project_id: projectId,
        title: "Typography Options",
        description: "Propositions de typographies pour la nouvelle identité",
        file_name: "typography_options.pdf",
        file_type: "pdf",
        file_size: "2.7 MB",
        file_url: "/placeholder.svg?height=600&width=450&text=Typography+Options",
        storage_path: `project-${projectId}/typography_options.pdf`,
        uploaded_by: designerId,
        is_client: false,
        status: "New",
        created_at: "2025-04-24T16:30:00Z",
      },
    ]

    await supabase.from("shared_files").upsert(sharedFiles)

    return { success: true, message: "Projet Brand Redesign créé avec succès", projectId }
  } catch (error) {
    console.error("Erreur lors de la création du projet Brand Redesign:", error)
    return { success: false, message: "Erreur lors de la création du projet", error }
  }
}
