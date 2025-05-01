"use client"

import { ClientPortal } from "@/components/client-portal"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"

// Type pour les données du projet
type ProjectData = {
  project: any
  client: any
  deliverables: any[]
  comments: any[]
  freelancer: any
  sharedFiles: any[]
}

// Composant de chargement pour afficher pendant que les données sont récupérées
function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-white">
      <div className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="p-4 border-b">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="p-4 flex-1">
          <Skeleton className="h-4 w-1/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-9 w-96 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-96 w-full lg:w-2/3" />
          <Skeleton className="h-96 w-full lg:w-1/3" />
        </div>
      </div>
    </div>
  )
}

// Fonction pour adapter les données au format attendu par ClientPortal
function adaptDataForClientPortal(data: any): ProjectData {
  if (!data) {
    return {
      project: {},
      client: {},
      deliverables: [],
      comments: [],
      freelancer: {},
      sharedFiles: []
    };
  }
  
  // Si les livrables sont directement dans la structure, les adapter
  let deliverables = data.deliverables || [];
  
  // Transformer chaque livrable si nécessaire
  deliverables = deliverables.map((deliverable: any) => {
    // Vérifier si le livrable a déjà une structure avec versions
    if (deliverable.versions) {
      return deliverable;
    }
    
    // Sinon, adapter le livrable pour avoir le format attendu
    return {
      ...deliverable,
      // Ajouter le livrable lui-même comme version (pour la compatibilité)
      versions: [
        {
          id: deliverable.id,
          version_name: deliverable.version_name || "Version 1",
          is_latest: deliverable.is_latest || true,
          created_at: deliverable.created_at,
          file_type: deliverable.file_type,
          file_name: deliverable.file_name,
          file_url: deliverable.file_url,
          status: deliverable.status,
          step_id: deliverable.step_id,
          description: deliverable.description
        }
      ]
    };
  });
  
  return {
    project: data.project,
    client: data.client,
    deliverables: deliverables,
    comments: data.comments || [],
    freelancer: data.freelancer,
    sharedFiles: data.sharedFiles || []
  };
}

// Composant principal qui affiche les données du projet
function ProjectPage({ projectData }: { projectData: any }) {
  // Vérifier si les données ont été récupérées correctement
  if (!projectData || !projectData.project) {
    return notFound()
  }
  
  // Adapter les données au format attendu par le composant ClientPortal
  const adaptedData = adaptDataForClientPortal(projectData);

  // Passer les données récupérées au composant ClientPortal
  return (
    <ClientPortal
      project={adaptedData.project}
      client={adaptedData.client}
      milestones={adaptedData.deliverables}
      freelancer={adaptedData.freelancer}
      comments={adaptedData.comments}
      sharedFiles={adaptedData.sharedFiles}
    />
  )
}

// Exporter le composant de page avec Suspense pour gérer le chargement
export default function ClientProjectPage({ projectData }: { projectData: any }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectPage projectData={projectData} />
    </Suspense>
  )
}
