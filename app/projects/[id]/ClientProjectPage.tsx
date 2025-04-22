"use client"

import { ClientPortal } from "@/components/client-portal"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"

// Type pour les données du projet
type ProjectData = {
  project: any
  client: any
  steps: any[]
  deliverables: any[]
  comments: any[]
  freelancer: any
  sharedFiles: any[]
}

// Composant de chargement pour afficher pendant que les données sont récupérées
function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="p-4 border-b bg-slate-50">
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

// Composant principal qui affiche les données du projet
function ProjectPage({ projectData }: { projectData: ProjectData }) {
  // Vérifier si les données ont été récupérées correctement
  if (!projectData || !projectData.project) {
    return notFound()
  }

  // Passer les données récupérées au composant ClientPortal
  return (
    <ClientPortal
      project={projectData.project}
      client={projectData.client}
      milestones={projectData.steps}
      freelancer={projectData.freelancer}
      comments={projectData.comments}
      sharedFiles={projectData.sharedFiles}
    />
  )
}

// Exporter le composant de page avec Suspense pour gérer le chargement
export default function ClientProjectPage({ projectData }: { projectData: ProjectData }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectPage projectData={projectData} />
    </Suspense>
  )
}
