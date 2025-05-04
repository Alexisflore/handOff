import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import { getProjectsAction } from "@/app/actions"

// Désactiver le cache pour cette page
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Composant de chargement pour la liste des projets
function LoadingProjects() {
  return (
    <div className="container mx-auto p-6">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  )
}

// Fonction pour récupérer tous les projets
async function getProjects() {
  try {
    // Utiliser l'action serveur explicite
    const result = await getProjectsAction()
    
    if (result.error) {
      console.error("Erreur lors de la récupération des projets:", result.error)
      return []
    }
    
    return result.data
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error)
    return []
  }
}

// Composant principal qui affiche la liste complète des projets
async function ProjectsList() {
  const projects = await getProjects()

  if (projects.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Tous les Projets</h1>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun projet disponible</h2>
            <p className="text-muted-foreground mb-6">Vous n'avez pas encore de projets actifs.</p>
            <Button asChild>
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tous les Projets</h1>
        <Button asChild variant="outline">
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <CardDescription>{project.clients?.company || "Client inconnu"}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    project.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : project.status === "in_progress"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }
                >
                  {project.status === "in_progress"
                    ? "En cours"
                    : project.status === "completed"
                      ? "Terminé"
                      : project.status === "pending"
                        ? "En attente"
                        : project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>Projet #{project.project_number}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Début: {new Date(project.start_date).toLocaleDateString()}</span>
                  <span>Fin: {new Date(project.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              {project.id ? (
                <Link href={`/projects/${project.id}`} className="w-full">
                  <Button variant="outline" className="w-full gap-1">
                    <span>Voir le projet</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full gap-1" disabled>
                  <span>ID de projet manquant</span>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Exporter le composant de page avec Suspense pour gérer le chargement
export default function Page() {
  return (
    <Suspense fallback={<LoadingProjects />}>
      <ProjectsList />
    </Suspense>
  )
}

// Métadonnées de la page
export const metadata = {
  title: "Tous les Projets | Handoff",
  description: "Liste complète de tous vos projets sur Handoff",
} 