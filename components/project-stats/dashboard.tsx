"use client"

import { useEffect, useState } from "react"
import { getProjectStats } from "@/services/project-service"
import { ProjectStats } from "./stats"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectDashboardProps {
  projectId: string
}

// Données par défaut pour assurer un affichage minimal
const defaultStats = {
  progress: 0,
  totalSteps: 0,
  completedSteps: 0,
  totalDeliverables: 0,
  approvedDeliverables: 0,
  rejectedDeliverables: 0,
  totalComments: 0,
  clientComments: 0,
  designerComments: 0,
  totalFiles: 0,
  clientFiles: 0,
  designerFiles: 0,
  daysLeft: 0,
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [stats, setStats] = useState<any>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getProjectStats(projectId)
        console.log("Dashboard stats loaded:", data)
        setStats(data || defaultStats)
      } catch (err) {
        console.error("Error fetching project stats:", err)
        setError("Failed to load project statistics. Please try again later.")
        // En cas d'erreur, utiliser les données par défaut pour éviter un écran vide
        setStats(defaultStats)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-4 w-full p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col items-center justify-center py-6 text-center w-full bg-red-50 rounded-lg">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">Error Loading Statistics</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
        
        {/* Continuer à afficher les statistiques par défaut pour éviter un écran vide */}
        <div className="w-full max-w-none">
          <ProjectStats stats={stats} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none">
      <ProjectStats stats={stats} />
    </div>
  )
} 