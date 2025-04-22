import ClientProjectPage from "./ClientProjectPage"
import Link from "next/link"
import { getProjectDetailsAction } from "@/app/actions"

// Désactiver le cache pour cette page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ params }: { params: { id: string } }) {
  // Les params doivent être attendus en premier
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Vérifier si l'ID est valide
  if (!id || id === "undefined" || id === "[id]") {
    // Au lieu de rediriger, afficher une page d'erreur
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
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
  console.log("projectData steps:", projectData?.steps?.length || 0);
  console.log("First step has versions:", projectData?.steps?.[0]?.versions ? "Yes" : "No");
  
  if (error || !projectData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
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
  return <ClientProjectPage projectData={projectData} />
}

// Générer les métadonnées de la page dynamiquement
export async function generateMetadata({ params }: { params: { id: string } }) {
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
