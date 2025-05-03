"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

import { addComment, getProjectDetails } from "@/services/project-service"
import { ProjectDashboard } from "@/components/project-stats/dashboard"
import { ProjectHistory } from "@/components/project-history"
import { ProjectFiles } from "@/components/project-files"

import { ClientHeader } from "./ClientHeader"
import { ClientSidebar } from "./ClientSidebar"
import { DeliverableSelector } from "./DeliverableSelector"
import { FilePreviewSection } from "./FilePreviewSection"
import { AddVersionModal } from "./AddVersionModal"
import { MobileSidebar } from "./MobileSidebar"
import { ActionFooter } from "./ActionFooter"
import { ClientPortalProps, Version, CurrentUser, Deliverable, Comment } from "./types"
import { TabType } from "@/app/projects/[id]/page"

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

  // État pour les données qui peuvent être mises à jour en temps réel
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [sharedFiles, setSharedFiles] = useState(initialSharedFiles)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [debugInfo, setDebugInfo] = useState<{[key: string]: any}>({})
  const [showDebug, setShowDebug] = useState(false)
  const router = useRouter()
  const [isDeliverableSelectorOpen, setIsDeliverableSelectorOpen] = useState(true)

  // Récupérer l'utilisateur connecté 
  useEffect(() => {
    // Aucun gestionnaire d'événement ici pour éviter que le sélecteur de livrables se ferme
  }, []);

  // Calcul du nombre de livrables approuvés
  const approvedDeliverables = deliverables.filter(d => d.status === "completed").length
  const totalDeliverables = deliverables.length
  const progress = totalDeliverables > 0 ? Math.round((approvedDeliverables / totalDeliverables) * 100) : 0

  // Trouver le livrable actuel (status = 'current')
  const currentDeliverableObj = deliverables.find((d) => d.status === "current") || deliverables[0] || null
  
  // Vérifications de sécurité au cas où aucun livrable n'est trouvé
  if (!currentDeliverableObj) {
    return (
      <div className="flex min-h-screen h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Données incomplètes</h2>
            <p>Aucun livrable n'a été trouvé pour ce projet.</p>
          </div>
          <a href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // État pour suivre le livrable actuellement sélectionné
  const [currentMilestone, setCurrentMilestone] = useState(currentDeliverableObj?.id || "")
  const [currentVersion, setCurrentVersion] = useState(
    currentDeliverableObj?.versions && currentDeliverableObj.versions.length > 0
      ? currentDeliverableObj.versions[0].id
      : ""
  )
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab as TabType)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false)

  // S'assurer que le sélecteur de livrables est toujours visible
  useEffect(() => {
    // Toujours garder le sélecteur ouvert
    setIsDeliverableSelectorOpen(true);
  }, [activeTab]); // Se déclenche à chaque changement d'onglet

  // Initialisation des onglets pour garantir l'affichage du contenu
  useEffect(() => {
    // Forcer l'affichage des onglets au chargement initial
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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const debugData: {[key: string]: any} = {
          logs: []
        };
        
        debugData.logs.push("Début de la vérification");
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Récupération de la session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        debugData.hasSession = !!session;
        
        if (error) {
          debugData.sessionError = error.message;
          setDebugInfo(debugData);
          return;
        }
        
        if (session && session.user) {
          debugData.userId = session.user.id;
          debugData.userEmail = session.user.email;
          debugData.userMetadata = session.user.user_metadata;
          debugData.rawSession = JSON.stringify(session, null, 2);
          
          try {
            // Recherche du rôle dans différents endroits possibles
            const roleFromMetadata = session.user.user_metadata?.role;
            const roleFromAppMetadata = session.user.app_metadata?.role;
            
            debugData.logs.push(`Role from metadata: ${roleFromMetadata || 'none'}`);
            debugData.logs.push(`Role from app_metadata: ${roleFromAppMetadata || 'none'}`);
            
            // Créer un tableau de tous les rôles potentiels
            const potentialRoles = [
              roleFromMetadata,
              roleFromAppMetadata,
              session.user.role
            ].filter(Boolean); // Filtrer les valeurs null/undefined
            
            debugData.potentialRoles = potentialRoles;
            
            // Vérifier si l'un des rôles correspond à "designer" (insensible à la casse)
            const isDesigner = potentialRoles.some(role => 
              typeof role === 'string' && role.toLowerCase() === 'designer'
            );
            
            // Vérifier aussi le rôle spécifique "DESIGNER"
            const isDesignerExact = potentialRoles.some(role => 
              typeof role === 'string' && role.toUpperCase() === 'DESIGNER'
            );
            
            debugData.isDesignerByAnyCase = isDesigner;
            debugData.isDesignerExact = isDesignerExact;
            
            // Vérifier également l'ID utilisateur comme fallback
            const isDesignerById = session.user.id === process.env.NEXT_PUBLIC_DESIGNER_ID;
            debugData.isDesignerById = isDesignerById;
            
            // Décision finale: l'utilisateur est un designer si l'un des tests ci-dessus est vrai
            const finalIsDesigner = isDesigner || isDesignerExact || isDesignerById;
            debugData.finalIsDesigner = finalIsDesigner;
            
            // Si l'utilisateur n'est pas reconnu comme designer mais a un ID de designer,
            // essayons de mettre à jour les métadonnées pour les futurs chargements
            if (isDesignerById && !isDesignerExact && !isDesigner) {
              debugData.logs.push("Tentative de mise à jour des métadonnées car ID designer sans rôle designer");
              
              // Mise à jour des métadonnées de l'utilisateur
              const { error: updateError } = await supabase.auth.updateUser({
                data: { role: 'DESIGNER' }
              });
              
              if (updateError) {
                debugData.logs.push(`Erreur mise à jour métadonnées: ${updateError.message}`);
              } else {
                debugData.logs.push("Métadonnées mises à jour avec succès");
              }
            }
            
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              role: roleFromMetadata || roleFromAppMetadata || session.user.role || 'unknown',
              isDesigner: finalIsDesigner
            });
          } catch (error: any) {
            debugData.parseError = error.message;
          }
        }
        
        setDebugInfo(debugData);
      } catch (error: any) {
        setDebugInfo({ globalError: error.message });
      }
    }
    
    fetchCurrentUser()
  }, [])

  // Trouver le livrable actif
  const activeDeliverable = deliverables.find((d) => d.id === currentMilestone) || deliverables[0] || null
  
  // Vérification supplémentaire au cas où activeDeliverable est null
  if (!activeDeliverable) {
    return (
      <div className="flex min-h-screen h-screen w-full items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Livrable introuvable</h2>
            <p>Le livrable sélectionné n'existe pas dans ce projet.</p>
          </div>
          <a href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }
  
  const activeVersions = activeDeliverable.versions || []
  const activeVersion =
    activeVersions.find((v: Version) => v.id === currentVersion) ||
    (activeVersions.length > 0 ? activeVersions[activeVersions.length - 1] : null)

  // Filtrer les commentaires pour le livrable actif
  const filteredComments = comments.filter((c) => c.deliverable_id === activeVersion?.id)

  // Fonction pour rafraîchir les données du projet
  const refreshProjectData = async () => {
    try {
      setIsRefreshing(true)
      const data = await getProjectDetails(project.id)
      if (data) {
        // Mettre à jour les données locales
        setComments(data.comments)
        setSharedFiles(data.sharedFiles)
        
        // Si venant d'une approbation, force reload
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('approved') === 'true') {
          // Forcer le rechargement de la page pour voir les modifications
          window.location.reload();
          return;
        }
        
        toast({
          title: "Données actualisées",
          description: "Les données du projet ont été actualisées avec succès.",
        })
      }
    } catch (error) {
      console.error("Error refreshing project data:", error)

      toast({
        title: "Erreur d'actualisation",
        description: "Une erreur s'est produite lors de l'actualisation des données.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fonction pour ajouter une nouvelle version
  const handleAddNewVersion = () => {
    setIsAddVersionModalOpen(true)
  }

  // Fonction pour soumettre une nouvelle version
  const submitNewVersion = async (data: {
    versionName: string
    versionDescription: string
    file: File
  }) => {
    try {
      // TODO: Implémenter l'appel API pour ajouter une nouvelle version
      // Cette partie devrait être implémentée selon votre API
      
      // Exemple simulé:
      toast({
        title: "Version ajoutée",
        description: "La nouvelle version a été ajoutée avec succès.",
      })
      
      // Rafraîchir les données
      await refreshProjectData()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Error adding new version:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'ajout de la nouvelle version.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  const handleSendComment = async (content: string) => {
    if (!activeVersion) return

    try {
      // Utiliser l'ID de l'utilisateur connecté
      const userId = currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"
      
      // Déterminer si l'utilisateur est un client en fonction des données de session
      const isClient = currentUser ? !currentUser.isDesigner : false
      
      // ID client à passer uniquement si c'est un client
      const clientIdParam = isClient ? client.id : undefined

      const newComment = await addComment(activeVersion.id, userId, content, isClient, clientIdParam)

      // Ajouter le nouveau commentaire à l'état local avec les bonnes informations
      if (newComment && newComment.length > 0) {
        // Créer un objet commentaire avec le bon nom d'utilisateur
        const commentWithUserInfo = {
          ...newComment[0],
          users: {
            full_name: isClient 
              ? client.name 
              : (currentUser?.full_name || freelancer?.users?.full_name || "John Doe"),
            avatar_url: isClient 
              ? client.logo_url 
              : (currentUser?.avatar_url || freelancer?.users?.avatar_url)
          },
          is_client: isClient
        }
        
        setComments((prev) => [...prev, commentWithUserInfo])
      }
      
      // Plus besoin de manipuler le DOM directement
      // Forcer l'affichage du filtre "milestone" si nécessaire avec un état
    } catch (error) {
      console.error("Error sending comment:", error)

      toast({
        title: "Erreur d'envoi",
        description: "Une erreur s'est produite lors de l'envoi du commentaire.",
        variant: "destructive",
      })
    }
  }

  const handleVersionChange = (versionId: string) => {
    console.log("Changing version to:", versionId);
    
    // Définir la version avant de trouver le livrable
    setCurrentVersion(versionId);

    // Trouver le livrable auquel appartient cette version
    for (const deliverable of deliverables) {
      if (deliverable.versions) {
        const versionExists = deliverable.versions.some((v: Version) => v.id === versionId)
        if (versionExists) {
          // Mettre à jour le livrable
          console.log("Found version in deliverable:", deliverable.id, deliverable.title);
          setCurrentMilestone(deliverable.id);
          
          // Afficher une notification pour confirmer l'action
          toast({
            title: "Version sélectionnée",
            description: "Affichage de la version pour " + deliverable.title
          });
          
          break;
        }
      }
    }

    // Forcer l'onglet "current"
    setActiveTab("current" as TabType);
  }

  // Fonction pour gérer la sélection d'un livrable
  const handleMilestoneClick = (deliverableId: string) => {
    // Vérification si le livrable existe
    const deliverable = deliverables.find(d => d.id === deliverableId);
    if (!deliverable) {
      toast({
        title: "Erreur",
        description: "Livrable non trouvé",
        variant: "destructive"
      });
      return;
    }
    
    // Ne pas traiter les livrables à venir
    if (deliverable.status === "upcoming") {
      return;
    }
    
    // Même s'il n'y a pas de versions, on peut sélectionner le livrable
    setCurrentMilestone(deliverable.id);
    
    // S'il a des versions, sélectionner la dernière ou celle marquée comme dernière
    if (deliverable.versions && deliverable.versions.length > 0) {
      // Trouver la version à afficher
      const latestVersion = deliverable.versions.find((v: Version) => v.is_latest) || 
                           deliverable.versions[deliverable.versions.length - 1];
      
      setCurrentVersion(latestVersion.id);
      
      // Notification
      toast({
        title: "Livrable sélectionné",
        description: `${deliverable.title} - ${latestVersion.version_name || "Dernière version"}`
      });
    } else {
      toast({
        title: "Livrable sélectionné",
        description: `${deliverable.title} - Aucune version disponible`
      });
    }
    
    // Forcer l'onglet "current"
    setActiveTab("current" as TabType);
    
    // Maintain scroll position at top
    setTimeout(() => {
      const contentContainer = document.querySelector('[data-value="current"]');
      if (contentContainer) {
        contentContainer.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      }
    }, 10);
    
    // Fermer le sélecteur
    closeDeliverableSelector();
  }

  // Fonction pour basculer l'affichage du sélecteur de livrables
  const toggleDeliverableSelector = () => {
    // Basculer entre afficher et masquer
    setIsDeliverableSelectorOpen(prev => !prev);
    
    // Scroll to the top of the content area
    setTimeout(() => {
      const contentContainer = document.querySelector('[data-value="current"]');
      if (contentContainer) {
        contentContainer.scrollTo({
          top: 0,
          behavior: 'instant' // Use 'instant' for immediate scroll without animation
        });
      }
    }, 10);
  }

  const closeDeliverableSelector = () => {
    // Ne plus fermer le sélecteur
    // setIsDeliverableSelectorOpen(false);
  }

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      await supabase.auth.signOut()
      
      // Redirection vers la page de connexion
      router.push('/login')
      return Promise.resolve()
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter. Veuillez réessayer.",
        variant: "destructive"
      })
      return Promise.reject(error)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
        {/* Header */}
        <ClientHeader 
          sidebarCollapsed={sidebarCollapsed}
          client={client}
          activeDeliverable={activeDeliverable}
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
            <main className="flex flex-1 flex-col p-0 overflow-auto w-full">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  console.log("Changing tab to:", value);
                  setActiveTab(value as TabType);
                  
                  // Force l'affichage de tous les contenus d'onglet, mais cache ceux qui ne sont pas actifs
                  setTimeout(() => {
                    const allTabContents = document.querySelectorAll('[id^="radix-"]');
                    allTabContents.forEach(content => {
                      if (content instanceof HTMLElement) {
                        // Supprimer l'attribut hidden pour tous
                        content.removeAttribute('hidden');
                        
                        // Pour les onglets non-actifs, on les masque avec CSS plutôt qu'avec l'attribut hidden
                        const tabId = content.id.split('-').pop();
                        if (tabId !== value) {
                          content.style.display = 'none';
                        } else {
                          content.style.display = 'block';
                          content.style.visibility = 'visible';
                        }
                      }
                    });
                    
                    // Gère le scroll pour l'onglet "current"
                    if (value === "current") {
                      const contentContainer = document.querySelector('[data-value="current"]');
                      if (contentContainer) {
                        contentContainer.scrollTo({
                          top: 0,
                          behavior: 'instant'
                        });
                      }
                    }
                  }, 50);
                }}
                className="w-full h-full flex flex-col overflow-hidden"
              >
                <div className="overflow-auto flex-1 flex flex-col min-h-0 border-b border-slate-200 w-full">
                  <TabsContent 
                    value="dashboard" 
                    className="flex-1 overflow-auto h-full w-full" 
                    style={{
                      display: "block", 
                      width: "100%", 
                      visibility: "visible"
                    }}
                    data-force-visible="true"
                  >
                    <div className="px-4 py-4 h-full w-full">
                      <ProjectDashboard projectId={project.id} />
                    </div>
                  </TabsContent>

                  <TabsContent value="current" className="flex-1 flex flex-col overflow-auto flex-grow w-full" style={{display: activeTab === "current" ? "flex" : "none", width: "100%"}}>
                    <div className="flex flex-col h-full justify-between space-y-4 px-4 pb-4">
                      {/* Section de sélection des livrables */}
                      <div className="flex flex-col space-y-4">
                        <DeliverableSelector
                          deliverables={deliverables}
                          activeDeliverableId={currentMilestone}
                          onDeliverableSelect={handleMilestoneClick}
                          closeSelector={closeDeliverableSelector}
                          project={project}
                          isOpen={isDeliverableSelectorOpen}
                        />
                        
                        {/* File Preview Section */}
                        <FilePreviewSection 
                          activeVersion={activeVersion}
                          currentMilestone={currentMilestone}
                          currentVersion={currentVersion}
                          comments={filteredComments}
                          onSendComment={handleSendComment}
                          onVersionChange={handleVersionChange}
                          isDesigner={currentUser?.isDesigner || false}
                          onAddNewVersion={handleAddNewVersion}
                        />
                      </div>

                      {/* Action footer */}
                      <ActionFooter 
                        activeVersion={activeVersion}
                        clientId={client.id}
                        userId={currentUser?.id}
                        onRefresh={refreshProjectData}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 overflow-auto flex-grow w-full" style={{display: activeTab === "history" ? "block" : "none", width: "100%"}}>
                    <div className="px-4 py-4 h-full">
                      <ProjectHistory milestones={deliverables} onViewVersion={handleVersionChange} comments={comments} />
                    </div>
                  </TabsContent>

                  <TabsContent value="my-files" className="flex-1 overflow-auto flex-grow w-full" style={{display: activeTab === "my-files" ? "block" : "none", width: "100%"}}>
                    <div className="px-4 py-4 h-full">
                      <ProjectFiles
                        files={sharedFiles}
                        projectId={project.id}
                        clientId={client.id}
                        onFileDeleted={refreshProjectData}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </main>
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
          onClose={() => setIsAddVersionModalOpen(false)}
          onSubmit={submitNewVersion}
        />
      </div>
    </TooltipProvider>
  )
} 