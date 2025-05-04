import ClientProjectPage from "./ClientProjectPage"
import Link from "next/link"
import { getProjectDetailsAction } from "@/app/actions"
import { Metadata } from "next"

// Désactiver le cache pour cette page
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Types d'onglets disponibles dans le portail client
export type TabType = "dashboard" | "current" | "history" | "my-files";

export default async function Page({ params, searchParams }: { 
  params: { id: string },
  searchParams: { tab?: TabType }
}) {
  // Les params doivent être attendus en premier
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Récupérer l'onglet actif depuis les paramètres d'URL ou utiliser "dashboard" par défaut
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "dashboard";
  
  // Vérifier si l'ID est valide
  if (!id || id === "undefined" || id === "[id]") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Erreur</h2>
            <p>L'identifiant du projet est invalide.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  // Récupérer toutes les données du projet en une seule action serveur
  const { data: projectData, error } = await getProjectDetailsAction(id);
  
  // Debug logs
  console.log("projectData deliverables:", projectData?.deliverables?.length || 0);
  console.log("First deliverable has versions:", projectData?.deliverables?.[0]?.versions ? "Yes" : "No");
  
  if (error || !projectData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Erreur</h2>
            <p>{error || "Projet non trouvé"}</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  // Passer toutes les données déjà chargées au composant client
  // Inclure l'onglet actif comme prop
  return (
    <div className="w-full h-screen overflow-hidden">
      <ClientProjectPage projectData={projectData} initialActiveTab={activeTab} />
    </div>
  )
}

// Générer les métadonnées de la page dynamiquement
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Les params doivent être attendus en premier
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Vérifier si l'ID est valide
    if (!id || id === "undefined" || id === "[id]") {
      return {
        title: "Projet non trouvé",
      }
    }

    const { data: projectData, error } = await getProjectDetailsAction(id);

    if (error || !projectData) {
      return {
        title: "Projet non trouvé",
      }
    }

    return {
      title: `${projectData.project.title} | Handoff`,
      description: `Portail client pour le projet ${projectData.project.title}`,
    }
  } catch (error) {
    return {
      title: "Erreur de chargement",
    }
  }
}
