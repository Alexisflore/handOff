"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  Clock,
  Download,
  FileIcon,
  History,
  MessageSquare,
  Menu,
  ChevronRight,
  BarChart,
  ChevronDown,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCommentThread } from "@/components/enhanced-comment-thread"
import { FilePreview } from "@/components/file-preview"
import { HoverVersionSelector } from "@/components/hover-version-selector"
import { ProjectFiles } from "@/components/project-files"
import { ProjectHistory } from "@/components/project-history"
import { SubtleMilestone } from "@/components/subtle-milestone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { addComment, getProjectDetails } from "@/services/project-service"
import { ApprovalDialog } from "@/components/approval-dialog"
import { ProjectDashboard } from "@/components/project-dashboard"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@supabase/ssr"

// Définir les types pour les props
interface ClientPortalProps {
  project: any
  client: any
  milestones: any[]
  freelancer: any
  comments: any[]
  sharedFiles: any[]
}

// Type pour les versions
interface Version {
  id: string
  version_name: string
  is_latest?: boolean
  created_at: string
  file_type?: string
  file_name?: string
  file_url?: string
  status?: string
  step_id: string
  description?: string
}

export function ClientPortal({
  project,
  client,
  milestones: deliverables,
  freelancer,
  comments: initialComments,
  sharedFiles: initialSharedFiles,
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
  const [comments, setComments] = useState(initialComments)
  const [sharedFiles, setSharedFiles] = useState(initialSharedFiles)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<{[key: string]: any}>({})
  const [showDebug, setShowDebug] = useState(false)

  // Récupérer l'utilisateur connecté
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
    currentDeliverableObj?.versions && Array.isArray(currentDeliverableObj.versions) && currentDeliverableObj.versions.length > 0
      ? currentDeliverableObj.versions[0].id
      : ""
  )
  const [activeTab, setActiveTab] = useState("current")
  const [showComments, setShowComments] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
    // Ouvrir le modal pour ajouter une nouvelle version
    const elem = document.getElementById('add-version-modal');
    if (elem) {
      elem.classList.remove('hidden');
    }
  }

  // Fonction pour fermer le modal d'ajout de version
  const closeAddVersionModal = () => {
    const elem = document.getElementById('add-version-modal');
    if (elem) {
      elem.classList.add('hidden');
    }
  }

  // Fonction pour soumettre une nouvelle version
  const submitNewVersion = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Récupérer les données du formulaire
    const formElement = event.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    const versionName = formData.get('versionName') as string;
    const versionDescription = formData.get('versionDescription') as string;
    const file = formData.get('file') as File;
    
    if (!versionName || !file) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // TODO: Implémenter l'appel API pour ajouter une nouvelle version
      // Cette partie devrait être implémentée selon votre API
      
      // Exemple simulé:
      toast({
        title: "Version ajoutée",
        description: "La nouvelle version a été ajoutée avec succès.",
      });
      
      // Fermer le modal
      closeAddVersionModal();
      
      // Rafraîchir les données
      refreshProjectData();
      
    } catch (error) {
      console.error("Error adding new version:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'ajout de la nouvelle version.",
        variant: "destructive",
      });
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

      // Force focus on current deliverable after sending a comment
      const commentThreadElement = document.querySelector('[data-filter="deliverable"]')
      if (commentThreadElement) {
        ;(commentThreadElement as HTMLButtonElement).click()
      }
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
    setCurrentVersion(versionId)

    // Trouver le livrable auquel appartient cette version
    for (const deliverable of deliverables) {
      if (deliverable.versions) {
        const versionExists = deliverable.versions.some((v: Version) => v.id === versionId)
        if (versionExists) {
          setCurrentMilestone(deliverable.id)
          break
        }
      }
    }

    if (activeTab !== "current") {
      setActiveTab("current")
    }
  }

  const handleMilestoneClick = (deliverable: any) => {
    // Ne pas permettre de cliquer sur les livrables à venir
    if (deliverable.status === "upcoming") return

    // Permettre de cliquer sur les livrables complétés et le livrable en cours
    if (deliverable.status === "completed" || deliverable.status === "current") {
      setCurrentMilestone(deliverable.id)

      // Définir la version actuelle comme la dernière version de ce livrable
      const selectedDeliverable = deliverables.find((d) => d.id === deliverable.id)
      if (selectedDeliverable && selectedDeliverable.versions && selectedDeliverable.versions.length > 0) {
        // Trouver la dernière version ou celle marquée comme is_latest
        const latestVersion =
          selectedDeliverable.versions.find((v: Version) => v.is_latest) ||
          selectedDeliverable.versions[selectedDeliverable.versions.length - 1]
        setCurrentVersion(latestVersion.id)
      }

      if (activeTab !== "current") {
        setActiveTab("current")
      }
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Adapter les données pour le composant SubtleMilestone
  const deliverablesForComponent = deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    icon: d.icon ? <span>{d.icon}</span> : undefined,
  }))

  // Adapter les données pour le composant HoverVersionSelector
  const versionsForSelector = activeVersions.map((v: Version) => ({
    id: v.id,
    name: v.version_name,
    date: new Date(v.created_at).toLocaleDateString(),
    isLatest: v.is_latest,
  }))

  // Adapter les commentaires pour le composant EnhancedCommentThread
  const commentsForThread = filteredComments.map((c) => ({
    id: c.id,
    author: {
      name: c.is_client ? client.name : freelancer?.users?.full_name || "Designer",
      avatar: c.is_client ? client.logo_url : freelancer?.users?.avatar_url,
      initials: c.is_client ? client.initials : freelancer?.initials || "AM",
    },
    content: c.content,
    timestamp: new Date(c.created_at).toLocaleString(),
    milestoneId: activeDeliverable.id,
    milestoneName: c.deliverable_name || activeDeliverable.title,
    versionId: c.deliverable_id,
    versionName: c.version_name || activeVersion?.version_name,
    isClient: c.is_client,
  }))

  return (
    <TooltipProvider>
      <div className="flex min-h-screen h-screen w-full bg-white overflow-hidden">
        {/* Debug panel */}
        <div className="fixed top-0 right-0 z-50 p-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="h-6 text-xs"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </Button>
          
          {showDebug && (
            <div className="bg-white border p-4 shadow-lg mt-1 rounded-md max-w-md max-h-96 overflow-auto">
              <h3 className="font-bold text-sm mb-2">Debug Info</h3>
              <div className="text-xs space-y-1">
                <p><b>User Info:</b> {currentUser ? `${currentUser.email} (${currentUser.role})` : 'Not logged in'}</p>
                <p><b>Is Designer:</b> {currentUser?.isDesigner ? 'Yes ✅' : 'No ❌'}</p>
                <p><b>Session:</b> {debugInfo.hasSession ? 'Yes' : 'No'}</p>
                <p><b>User ID:</b> {debugInfo.userId || 'N/A'}</p>
                <p><b>Designer ID Env:</b> {process.env.NEXT_PUBLIC_DESIGNER_ID || 'Not set'}</p>
                <p><b>Role in Metadata:</b> {debugInfo.userMetadata?.role || 'None'}</p>
                <p><b>Role Direct:</b> {debugInfo.userRole || 'None'}</p>
                <p><b>Designer by Metadata:</b> {debugInfo.isDesignerByAnyCase ? 'Yes' : 'No'}</p>
                <p><b>Designer Exact:</b> {debugInfo.isDesignerExact ? 'Yes' : 'No'}</p>
                <p><b>Designer by ID:</b> {debugInfo.isDesignerById ? 'Yes' : 'No'}</p>
                <p><b>Final Result:</b> {debugInfo.finalIsDesigner ? 'Is Designer' : 'Not Designer'}</p>
                
                {debugInfo.globalError && <p className="text-red-500"><b>Error:</b> {debugInfo.globalError}</p>}
                
                {debugInfo.logs && debugInfo.logs.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <h4 className="font-bold mb-1">Logs:</h4>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {debugInfo.logs.map((log: string, index: number) => (
                        <li key={index}>{log}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {debugInfo.potentialRoles && debugInfo.potentialRoles.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <h4 className="font-bold mb-1">Potential Roles:</h4>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {debugInfo.potentialRoles.map((role: string, index: number) => (
                        <li key={index}>{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-2 border-t pt-2">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-blue-500 underline hover:text-blue-700"
                  >
                    Refresh Page
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      alert('Local storage cleared. Page will reload.');
                      window.location.reload();
                    }} 
                    className="text-blue-500 underline hover:text-blue-700 ml-4"
                  >
                    Clear Storage & Reload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar - with client branding */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "w-16" : "w-64"
          } flex-col border-r bg-white md:flex hidden relative`}
        >
          <div className="flex h-full flex-col">
            {/* Client branding */}
            <div
              className={`flex ${
                sidebarCollapsed ? "justify-center" : "items-center gap-3"
              } p-4 border-b bg-slate-50 overflow-hidden`}
            >
              <Avatar className={`${sidebarCollapsed ? "h-10 w-10" : "h-12 w-12"} flex-shrink-0`}>
                <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.company} />
                <AvatarFallback className="bg-blue-100 text-blue-700">{client.initials}</AvatarFallback>
              </Avatar>
              <div className={`transition-opacity duration-200 ${sidebarCollapsed ? "hidden" : "block"}`}>
                <p className="font-medium text-sm truncate">{client.company}</p>
                <p className="text-xs text-muted-foreground truncate">{client.name}</p>
              </div>
            </div>

            {/* Project info */}
            <div className={`p-4 border-b ${sidebarCollapsed ? "items-center justify-center" : ""} flex flex-col`}>
              <h2 className={`text-base font-semibold mb-1 truncate ${sidebarCollapsed ? "hidden" : "block"}`}>
                {project.title}
              </h2>
              <div className={`flex items-center gap-2 mb-2 ${sidebarCollapsed ? "hidden" : "flex"}`}>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs">
                  {project.status === "in_progress" ? "In Progress" : project.status}
                </Badge>
                <p className="text-xs text-muted-foreground">Project #{project.project_number}</p>
              </div>
              <div
                className={`flex justify-between text-xs text-muted-foreground ${sidebarCollapsed ? "hidden" : "flex"}`}
              >
                <span>
                  Started:{" "}
                  {new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span>
                  Due: {new Date(project.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <h3
                className={`text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider ${
                  sidebarCollapsed ? "hidden" : "block"
                }`}
              >
                Navigation
              </h3>
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "dashboard" ? "default" : "ghost"}
                      className={`w-full justify-${sidebarCollapsed ? "center" : "start"} gap-2 h-9 text-sm`}
                      onClick={() => setActiveTab("dashboard")}
                    >
                      <BarChart className="h-4 w-4" />
                      <span className={sidebarCollapsed ? "hidden" : "block"}>Dashboard</span>
                    </Button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">Dashboard</TooltipContent>}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "current" ? "default" : "ghost"}
                      className={`w-full justify-${sidebarCollapsed ? "center" : "start"} gap-2 h-9 text-sm`}
                      onClick={() => setActiveTab("current")}
                    >
                      <Clock className="h-4 w-4" />
                      <span className={sidebarCollapsed ? "hidden" : "block"}>Current Deliverable</span>
                    </Button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">Current Deliverable</TooltipContent>}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "history" ? "default" : "ghost"}
                      className={`w-full justify-${sidebarCollapsed ? "center" : "start"} gap-2 h-9 text-sm`}
                      onClick={() => setActiveTab("history")}
                    >
                      <History className="h-4 w-4" />
                      <span className={sidebarCollapsed ? "hidden" : "block"}>Version History</span>
                    </Button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">Version History</TooltipContent>}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "my-files" ? "default" : "ghost"}
                      className={`w-full justify-${sidebarCollapsed ? "center" : "start"} gap-2 h-9 text-sm`}
                      onClick={() => setActiveTab("my-files")}
                    >
                      <FileIcon className="h-4 w-4" />
                      <span className={sidebarCollapsed ? "hidden" : "block"}>Files</span>
                    </Button>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">Files</TooltipContent>}
                </Tooltip>
              </div>
            </nav>

            {/* Deliverables info - remplace Project Progress */}
            <div className={`p-4 border-t ${sidebarCollapsed ? "hidden" : "block"}`}>
              <div className="flex items-center text-sm mb-2">
                <h3 className="font-medium">Deliverables</h3>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>
                    {approvedDeliverables} of {totalDeliverables} approved
                  </span>
                  <span>
                    {Math.round((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}{" "}
                    days left
                  </span>
                </div>
              </div>
            </div>

            {/* Designer info - subtle branding */}
            <div className={`p-4 border-t bg-slate-50 ${sidebarCollapsed ? "flex flex-col items-center" : ""}`}>
              <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={freelancer?.users?.avatar_url || "/placeholder.svg"}
                    alt={freelancer?.users?.full_name}
                  />
                  <AvatarFallback className="bg-teal-100 text-teal-700">{freelancer?.initials}</AvatarFallback>
                </Avatar>
                <div className={`transition-opacity duration-200 ${sidebarCollapsed ? "hidden" : "block"}`}>
                  <p className="text-sm font-medium">
                    {freelancer?.users?.full_name} • {freelancer?.company}
                  </p>
                  <p className="text-xs text-muted-foreground">{freelancer?.role}</p>
                </div>
              </div>

              {/* Handoff branding - visible in both states */}
              <div className={`flex items-center mt-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
                <p
                  className={`text-xs text-muted-foreground flex items-center gap-1 ${sidebarCollapsed ? "flex-col" : ""}`}
                >
                  {!sidebarCollapsed && <span>Powered by</span>}
                  <img
                    src="/placeholder.svg?height=16&width=16&text=H"
                    alt="Handoff"
                    className={`${sidebarCollapsed ? "h-5 w-5 mb-1" : "h-4 w-4 inline-block"}`}
                  />
                  {!sidebarCollapsed && <span className="font-medium">Handoff</span>}
                </p>
              </div>
            </div>

            {/* Toggle button - repositionné correctement */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-colors p-0"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3 w-3 text-slate-500" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-slate-500" />
              )}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        <div className={`md:hidden fixed inset-0 z-50 bg-black/50 ${mobileSidebarOpen ? "block" : "hidden"}`} onClick={() => setMobileSidebarOpen(false)}>
          <div className="h-full w-64 bg-white" onClick={(e) => e.stopPropagation()}>
            {/* Mobile sidebar content */}
            <div className="flex h-full flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.company} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">{client.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{client.company}</p>
                    <p className="text-xs text-muted-foreground">{client.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(false)}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              <div className="mb-4">
                <h2 className="text-base font-semibold mb-1">{project.title}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs">
                    {project.status === "in_progress" ? "In Progress" : project.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Project #{project.project_number}</p>
                </div>
              </div>

              <nav className="mb-4">
                <h3 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                  Navigation
                </h3>
                <div className="space-y-2">
                  <Button
                    variant={activeTab === "dashboard" ? "default" : "ghost"}
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      setActiveTab("dashboard")
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <BarChart className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    variant={activeTab === "current" ? "default" : "ghost"}
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      setActiveTab("current")
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Current Deliverable</span>
                  </Button>
                  <Button
                    variant={activeTab === "history" ? "default" : "ghost"}
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      setActiveTab("history")
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <History className="h-4 w-4" />
                    <span>Version History</span>
                  </Button>
                  <Button
                    variant={activeTab === "my-files" ? "default" : "ghost"}
                    className="w-full justify-start gap-2 h-9 text-sm"
                    onClick={() => {
                      setActiveTab("my-files")
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <FileIcon className="h-4 w-4" />
                    <span>Files</span>
                  </Button>
                </div>
              </nav>

              <div className="mb-4">
                <div className="flex items-center text-sm mb-2">
                  <h3 className="font-medium">Deliverables</h3>
                </div>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>
                      {approvedDeliverables} of {totalDeliverables} approved
                    </span>
                    <span>
                      {Math.round(
                        (new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )}{" "}
                      days left
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={freelancer?.users?.avatar_url || "/placeholder.svg"}
                      alt={freelancer?.users?.full_name}
                    />
                    <AvatarFallback className="bg-teal-100 text-teal-700">{freelancer?.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {freelancer?.users?.full_name} • {freelancer?.company}
                    </p>
                    <p className="text-xs text-muted-foreground">{freelancer?.role}</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Powered by
                    <img
                      src="/placeholder.svg?height=16&width=16&text=H"
                      alt="Handoff"
                      className="h-4 w-4 inline-block"
                    />
                    <span className="font-medium">Handoff</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Content Area - Removed mobile header */}
          <main className="flex flex-1 flex-col p-4 overflow-auto min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between flex-shrink-0 mb-2">
                <TabsList className="h-9">
                  <TabsTrigger value="dashboard" className="px-3 text-sm">
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="current" className="px-3 text-sm">
                    Current Deliverable
                  </TabsTrigger>
                  <TabsTrigger value="history" className="px-3 text-sm">
                    History
                  </TabsTrigger>
                  <TabsTrigger value="my-files" className="px-3 text-sm">
                    Files
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={refreshProjectData}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? "Actualisation..." : "Actualiser"}
                  </Button>
                  <RealtimeNotifications projectId={project.id} userId={currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"} />
                </div>
              </div>

              <div className="overflow-hidden flex-1 flex flex-col min-h-0">
                <TabsContent value="dashboard" className="flex-1 overflow-auto mt-0 h-full">
                  <ProjectDashboard projectId={project.id} />
                </TabsContent>

                <TabsContent value="current" className="flex-1 flex flex-col overflow-auto h-full">
                  <div className="flex flex-col space-y-4 h-full">
                    {/* Deliverable header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-l-4 border-l-teal-500 bg-white p-4 rounded-md shadow-sm hover:shadow transition-shadow duration-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-lg font-semibold">
                            {activeDeliverable.title}
                          </h1>
                          
                          <Badge
                            variant="outline"
                            className={
                              activeDeliverable.status === "completed"
                                ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border-green-200"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors border-amber-200"
                            }
                          >
                            {activeDeliverable.status === "completed" ? "Approved" : "Awaiting Review"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activeVersion?.description || activeDeliverable.description}
                        </p>
                      </div>
                      
                      {/* Bouton de version discret à droite */}
                      <div className="relative flex-shrink-0 self-start md:self-center flex items-center gap-2">
                        {/* Bouton "Add a new version" visible uniquement pour les designers */}
                        {currentUser?.isDesigner ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 flex items-center gap-1.5 text-sm border-teal-600 text-teal-700 hover:bg-teal-50"
                            onClick={handleAddNewVersion}
                          >
                            <span>Add a new version</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Designer tools not available</span>
                        )}
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3 flex items-center gap-1.5 text-sm bg-teal-600 hover:bg-teal-700"
                          onClick={() => {
                            const elem = document.getElementById('version-dropdown');
                            if (elem) {
                              elem.classList.toggle('hidden');
                            }
                          }}
                        >
                          <span>Version {activeVersion?.version_name?.match(/\d+/)?.[0] || "1"}</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        
                        {/* Dropdown menu for versions */}
                        <div 
                          id="version-dropdown"
                          className="absolute right-0 top-full mt-1 z-50 w-48 hidden"
                        >
                          <div className="bg-white rounded-md shadow-lg border border-gray-200 py-1">
                            {/* Si activeVersions est vide ou n'a qu'un seul élément, on affiche "Version 1" */}
                            {(activeVersions.length <= 1) ? (
                              <div
                                className="px-3 py-1.5 text-sm cursor-pointer bg-gray-100 font-medium"
                              >
                                Version 1
                              </div>
                            ) : (
                              activeVersions.map((version: Version, index: number) => (
                                <div
                                  key={version.id}
                                  className={`px-3 py-1.5 text-sm cursor-pointer ${version.id === activeVersion?.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                                  onClick={(e) => {
                                    handleVersionChange(version.id);
                                    const elem = document.getElementById('version-dropdown');
                                    if (elem) {
                                      elem.classList.add('hidden');
                                    }
                                  }}
                                >
                                  Version {version.version_name || (index + 1)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main content area - using flex-1 to take all available space */}
                    <div className="flex flex-1 flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                      {/* Left column - File preview */}
                      <div className={`flex-1 ${showComments ? "lg:w-2/3" : "lg:w-full"} min-h-0 flex flex-col`}>
                        <Card className="h-full flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200 overflow-hidden">
                          <CardHeader className="flex-row items-center justify-between space-y-0 py-3 px-4 border-b flex-shrink-0">
                            <CardTitle className="text-sm font-medium">Preview</CardTitle>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download File</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={toggleComments}>
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="sr-only">Toggle Comments</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{showComments ? "Hide Comments" : "Show Comments"}</TooltipContent>
                              </Tooltip>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0 flex-1 overflow-auto min-h-0">
                            {activeVersion && (
                              <FilePreview
                                fileType={activeVersion.file_type || "image"}
                                fileName={
                                  activeVersion.file_name ||
                                  `${activeDeliverable.title}_${activeVersion.version_name}.${activeVersion.file_type === "pdf" ? "pdf" : "png"}`
                                }
                                fileUrl={
                                  activeVersion.file_url ||
                                  "/placeholder.svg?height=600&width=450&text=Preview+Not+Available"
                                }
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right column - Comments */}
                      {showComments && (
                        <div className="lg:w-1/3 h-full min-h-0 flex flex-col">
                          <Card className="h-full flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200 overflow-hidden">
                            <EnhancedCommentThread
                              allComments={commentsForThread}
                              currentMilestone={currentMilestone}
                              currentVersion={currentVersion}
                              onSendComment={handleSendComment}
                            />
                          </Card>
                        </div>
                      )}
                    </div>

                    {/* Action footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-md shadow-sm hover:shadow transition-shadow duration-200">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div>
                          <div>
                            <p className="text-sm font-medium">
                              Delivered on {activeVersion ? new Date(activeVersion.created_at).toLocaleDateString() : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activeVersion?.status === "approved" 
                                ? "Approved" 
                                : activeVersion?.status === "rejected"
                                  ? "Changes requested"
                                  : "Waiting for your approval"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {activeVersion && activeVersion.id ? (
                        <ApprovalDialog
                          deliverableId={activeVersion.id}
                          clientId={client.id}
                          isApproved={activeVersion.status === "approved"}
                          onApproved={() => {
                            // Dans une application réelle, vous rechargeriez les données ici
                            refreshProjectData()
                          }}
                          onRejected={() => {
                            // Dans une application réelle, vous rechargeriez les données ici
                            refreshProjectData()
                          }}
                        />
                      ) : (
                        <Button disabled className="w-full sm:w-auto gap-2 h-9 bg-slate-100 text-slate-700 opacity-50">
                          <span>No Version Available</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-auto mt-0 h-full">
                  <ProjectHistory milestones={deliverables} onViewVersion={handleVersionChange} comments={comments} />
                </TabsContent>

                <TabsContent value="my-files" className="flex-1 overflow-auto mt-0 h-full">
                  <ProjectFiles
                    files={sharedFiles}
                    projectId={project.id}
                    clientId={client.id}
                    onFileDeleted={refreshProjectData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </main>
        </div>
        
        {/* Modal pour ajouter une nouvelle version */}
        <div id="add-version-modal" className="fixed inset-0 z-50 bg-black/50 hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add a new version</h3>
            
            <form onSubmit={submitNewVersion} className="space-y-4">
              <div>
                <label htmlFor="versionName" className="block text-sm font-medium mb-1">Version Name*</label>
                <input 
                  type="text" 
                  id="versionName" 
                  name="versionName" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. Version 2"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="versionDescription" className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  id="versionDescription" 
                  name="versionDescription"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Describe the changes in this version..."
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="file" className="block text-sm font-medium mb-1">Upload File*</label>
                <input 
                  type="file" 
                  id="file" 
                  name="file"
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={closeAddVersionModal}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Version
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
