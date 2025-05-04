"use client"

import React, { useState, useMemo } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs"

import { ClientHeader } from "./ClientHeader"
import { ClientSidebar } from "./ClientSidebar"
import { MobileSidebar } from "./MobileSidebar"
import { AddVersionModal } from "./AddVersionModal"
import { ClientPortalContent } from "./ClientPortalContent"
import { ClientPortalProps, Comment } from "./types"
import { TabType } from "@/app/projects/[id]/page"

// Hooks
import { useProjectSteps } from "../../hooks/useProjectSteps"
import { useUserData } from "../../hooks/useUserData"
import { useComments } from "../../hooks/useComments"
import { useProjectData } from "../../hooks/useProjectData"
import { useDeliverables } from "../../hooks/useDeliverables"
import { useVersions } from "../../hooks/useVersions"

export function ClientPortal({
  project,
  client,
  milestones: deliverables,
  freelancer,
  comments: initialComments,
  sharedFiles: initialSharedFiles,
  initialActiveTab = "current"
}: ClientPortalProps) {
  // Vérifier si les données essentielles sont disponibles
  if (!project || !deliverables || deliverables.length === 0) {
    return (
      <div className="flex min-h-screen h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Données incomplètes</h2>
            <p>Impossible d'afficher les détails du projet. Données manquantes.</p>
            <p className="text-xs mt-2">Code: DATA_INCOMPLETE</p>
          </div>
          <a 
            href="/"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Utiliser les hooks personnalisés
  const { currentUser } = useUserData();
  const projectSteps = useProjectSteps(project, deliverables);
  const { comments, setComments, handleSendComment } = useComments(initialComments);
  const { sharedFiles, isRefreshing, refreshProjectData } = useProjectData(project.id, initialSharedFiles);

  // Hook pour les livrables et étapes
  const {
    currentMilestone,
    setCurrentMilestone,
    currentVersion,
    setCurrentVersion,
    activeTab,
    setActiveTab,
    isDeliverableSelectorOpen,
    setIsDeliverableSelectorOpen,
    activeDeliverable,
    stepDeliverables,
    allStepVersions,
    activeVersions,
    activeVersion,
    activeStep,
    handleMilestoneClick,
    handleVersionChange,
    toggleDeliverableSelector
  } = useDeliverables(deliverables, projectSteps);

  // Hook pour les versions
  const {
    isAddVersionModalOpen,
    setIsAddVersionModalOpen,
    addingVersionForStepId,
    handleAddNewVersion: handleAddNewVersionBase,
    submitNewVersion
  } = useVersions();

  // État UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();

  // Calcul du nombre de livrables approuvés
  const approvedDeliverables = deliverables.filter(d => d.status === "completed").length;
  const totalDeliverables = deliverables.length;
  const progress = totalDeliverables > 0 ? Math.round((approvedDeliverables / totalDeliverables) * 100) : 0;

  // Wrapper pour handleAddNewVersion qui utilise les données contextuelles
  const handleAddNewVersion = (stepId?: string) => {
    handleAddNewVersionBase(stepId, currentMilestone, deliverables);
  };

  // Wrapper pour submitNewVersion qui utilise les données contextuelles
  const handleSubmitNewVersion = async (data: { versionName: string; versionDescription: string; file: File }) => {
    return submitNewVersion(
      data,
      project,
      deliverables,
      currentMilestone,
      projectSteps,
      currentUser,
      freelancer,
      refreshProjectData
    );
  };

  // Wrapper pour handleSendComment avec les paramètres de contexte
  const handleSendCommentWrapper = async (content: string) => {
    if (!activeVersion) return Promise.resolve();
    
    // Utiliser l'ID de l'utilisateur connecté
    const userId = currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001";
    
    // Déterminer si l'utilisateur est un client en fonction des données de session
    const isClient = currentUser ? !currentUser.isDesigner : false;
    
    await handleSendComment(
      activeVersion.id, 
      userId, 
      content, 
      isClient,
      client,
      freelancer,
      currentUser
    );
    
    return Promise.resolve();
  };

  // Filtrer les commentaires pour la version active
  const filteredComments = useMemo(() => {
    return comments.filter((c: Comment) => c.deliverable_id === activeVersion?.id);
  }, [comments, activeVersion]);

  // Fonction pour ajouter un nouveau livrable
  const handleAddDeliverable = () => {
    useToast().toast({
      title: "Ajout de livrable",
      description: "Fonctionnalité en cours de développement."
    });
  };

  // Fonction pour fermer le sélecteur de livrables (garde la même fonction que toggle pour compatibilité)
  const closeDeliverableSelector = () => {
    // Cette fonction ne fait rien, mais on la garde pour compatibilité d'interface
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.signOut();
      
      // Redirection vers la page de connexion
      router.push('/login');
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      useToast().toast({
        title: "Erreur",
        description: "Impossible de se déconnecter. Veuillez réessayer.",
        variant: "destructive"
      });
      return Promise.reject(error);
    }
  };

  // Réinitialiser l'état des onglets au chargement
  React.useEffect(() => {
    // Initialisation des onglets pour garantir l'affichage du contenu
    setTimeout(() => {
      // Force l'onglet courant à s'afficher correctement
      const tabContents = document.querySelectorAll('[id^="radix-"][id$="-content-dashboard"]');
      
      tabContents.forEach(content => {
        if (content instanceof HTMLElement) {
          console.log("Initializing dashboard tab:", content.id);
          content.removeAttribute('hidden');
          content.style.display = activeTab === 'dashboard' ? 'block' : 'none';
          content.style.visibility = 'visible';
          
          // Si c'est l'onglet actif, on s'assure qu'il est visible
          if (activeTab === 'dashboard') {
            // On vérifie le contenu
            const isEmpty = content.innerHTML.trim() === '';
            console.log("Dashboard tab is empty:", isEmpty);
            
            // Forcer un re-rendu si vide
            if (isEmpty && content.querySelector('div')) {
              // Forcer le re-rendu en modifiant le DOM
              const container = content.querySelector('div');
              if (container) {
                const temp = container.innerHTML;
                container.innerHTML = ''; 
                setTimeout(() => { container.innerHTML = temp; }, 10);
              }
            }
          }
        }
      });
    }, 500);
  }, [activeTab]);

  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
        {/* Header - Passer l'étape active au lieu du livrable actif */}
        <ClientHeader 
          sidebarCollapsed={sidebarCollapsed}
          client={client}
          activeDeliverable={activeDeliverable}
          activeStep={activeStep}
          refreshProjectData={refreshProjectData}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          toggleDeliverableSelector={toggleDeliverableSelector}
          project={project}
        />

        {/* Corps principal - sidebar + contenu */}
        <div className="flex flex-1 overflow-hidden w-full">
          {/* Sidebar */}
          <ClientSidebar 
            project={project}
            client={client}
            freelancer={freelancer}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            approvedDeliverables={approvedDeliverables}
            totalDeliverables={totalDeliverables}
            handleLogout={handleLogout}
            currentUser={currentUser}
          />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden w-full">
            <ClientPortalContent
              activeTab={activeTab}
              project={project}
              currentMilestone={currentMilestone}
              isDeliverableSelectorOpen={isDeliverableSelectorOpen}
              projectSteps={projectSteps}
              handleMilestoneClick={handleMilestoneClick}
              closeDeliverableSelector={closeDeliverableSelector}
              currentUser={currentUser}
              handleAddDeliverable={handleAddDeliverable}
              activeVersion={activeVersion}
              currentVersion={currentVersion}
              allStepVersions={allStepVersions}
              filteredComments={filteredComments}
              handleSendComment={handleSendCommentWrapper}
              handleVersionChange={handleVersionChange}
              handleAddNewVersion={handleAddNewVersion}
              client={client}
              refreshProjectData={refreshProjectData}
              comments={comments}
              sharedFiles={sharedFiles}
            />
          </div>
          
          {/* Mobile sidebar drawer */}
          <MobileSidebar 
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            project={project}
            client={client}
            freelancer={freelancer}
            approvedDeliverables={approvedDeliverables}
            totalDeliverables={totalDeliverables}
            handleLogout={handleLogout}
          />
        </div>
        
        {/* Modal pour ajouter une nouvelle version */}
        <AddVersionModal 
          isOpen={isAddVersionModalOpen}
          onClose={() => {
            console.log("Demande de fermeture du modal");
            
            // 1. Mettre à jour l'état React
            setIsAddVersionModalOpen(false);
            
            // 2. Manipuler directement le DOM pour garantir la fermeture
            setTimeout(() => {
              const modalElement = document.getElementById('version-modal-container');
              if (modalElement) {
                modalElement.style.display = 'none';
                console.log("Modal fermé via DOM depuis parent");
              }
              document.body.style.overflow = 'auto';
            }, 50);
            
            console.log("Modal fermé");
          }}
          onSubmit={handleSubmitNewVersion}
        />
        
        {/* Modal de secours intégré directement - apparaît seulement quand nécessaire */}
        <div 
          id="backup-version-modal" 
          className="fixed inset-0 z-[9999] bg-black/50 items-center justify-center"
          style={{ display: 'none' }}
        >
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle version (Secours)</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Pour ajouter une nouvelle version, veuillez rafraîchir la page et réessayer.
            </p>
            
            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => {
                  const modal = document.getElementById('backup-version-modal');
                  if (modal) modal.style.display = 'none';
                  document.body.style.overflow = 'auto';
                }}
              >
                Fermer
              </button>
              <button 
                type="button"
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                onClick={() => window.location.reload()}
              >
                Rafraîchir la page
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 