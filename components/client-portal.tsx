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
  milestones,
  freelancer,
  comments: initialComments,
  sharedFiles: initialSharedFiles,
}: ClientPortalProps) {
  // Vérifier si les données essentielles sont disponibles
  if (!project || !milestones || milestones.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
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

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Erreur de récupération de session:", error)
        return
      }
      
      if (session && session.user) {
        // Récupérer les informations détaillées de l'utilisateur depuis la table users
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()
          
        if (userError) {
          console.error("Erreur de récupération des infos utilisateur:", userError)
          return
        }
        
        // Vérifier si c'est un client ou un designer
        const isDesigner = session.user.id === process.env.NEXT_PUBLIC_DESIGNER_ID
        
        setCurrentUser({
          ...userData,
          isDesigner
        })
      }
    }
    
    fetchCurrentUser()
  }, [])

  // Trouver l'étape actuelle (status = 'current')
  const currentMilestoneObj = milestones.find((m) => m.status === "current") || milestones[0] || null
  
  // Vérifications de sécurité au cas où aucune étape n'est trouvée
  if (!currentMilestoneObj) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 max-w-md">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Données incomplètes</h2>
            <p>Aucune étape n'a été trouvée pour ce projet.</p>
          </div>
          <a href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Trouver le dernier livrable de l'étape actuelle
  const currentVersionsArray = currentMilestoneObj?.versions || []
  const latestVersion =
    currentVersionsArray.find((v: Version) => v.is_latest) ||
    (currentVersionsArray.length > 0 ? currentVersionsArray[currentVersionsArray.length - 1] : null)

  // État pour suivre l'étape et le livrable actuellement sélectionnés
  const [currentMilestone, setCurrentMilestone] = useState(currentMilestoneObj?.id || "")
  const [currentVersion, setCurrentVersion] = useState(latestVersion?.id || "")
  const [activeTab, setActiveTab] = useState("current")
  const [showComments, setShowComments] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Trouver l'étape et la version actives
  const activeMilestone = milestones.find((m) => m.id === currentMilestone) || milestones[0] || null
  
  // Vérification supplémentaire au cas où activeMilestone est null
  if (!activeMilestone) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 max-w-md">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Étape introuvable</h2>
            <p>L'étape sélectionnée n'existe pas dans ce projet.</p>
          </div>
          <a href="/" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }
  
  const activeVersions = activeMilestone.versions || []
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
        setComments(data.comments)
        setSharedFiles(data.sharedFiles)

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

      // Force focus on current milestone after sending a comment
      const commentThreadElement = document.querySelector('[data-filter="milestone"]')
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

    // Trouver l'étape à laquelle appartient cette version
    for (const milestone of milestones) {
      if (milestone.versions) {
        const versionExists = milestone.versions.some((v: Version) => v.id === versionId)
        if (versionExists) {
          setCurrentMilestone(milestone.id)
          break
        }
      }
    }

    if (activeTab !== "current") {
      setActiveTab("current")
    }
  }

  const handleMilestoneClick = (milestone: any) => {
    // Ne pas permettre de cliquer sur les milestones à venir
    if (milestone.status === "upcoming") return

    // Permettre de cliquer sur les milestones complétés et le milestone en cours
    if (milestone.status === "completed" || milestone.status === "current") {
      setCurrentMilestone(milestone.id)

      // Définir la version actuelle comme la dernière version de cette étape
      const selectedMilestone = milestones.find((m) => m.id === milestone.id)
      if (selectedMilestone && selectedMilestone.versions && selectedMilestone.versions.length > 0) {
        // Trouver la dernière version ou celle marquée comme is_latest
        const latestVersion =
          selectedMilestone.versions.find((v: Version) => v.is_latest) ||
          selectedMilestone.versions[selectedMilestone.versions.length - 1]
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
  const milestonesForComponent = milestones.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    icon: m.icon ? <span>{m.icon}</span> : undefined,
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
    milestoneId: activeMilestone.id,
    milestoneName: c.milestone_name || activeMilestone.title,
    versionId: c.deliverable_id,
    versionName: c.version_name || activeVersion?.version_name,
    isClient: c.is_client,
  }))

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
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
              {sidebarCollapsed && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs">
                  {project.progress}%
                </Badge>
              )}
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

            {/* Project progress */}
            <div className={`p-4 border-t ${sidebarCollapsed ? "hidden" : "block"}`}>
              <div className="flex justify-between items-center text-sm mb-2">
                <h3 className="font-medium">Project Progress</h3>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-teal-500 rounded-full shadow-sm"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {milestones.filter((m) => m.status === "completed").length} of {milestones.length} milestones
                </span>
                <span>
                  {Math.round((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}{" "}
                  days left
                </span>
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

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Sidebar */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
              <div
                className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
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
                  <div className="flex justify-between items-center text-sm mb-2">
                    <h3 className="font-medium">Project Progress</h3>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-teal-500 rounded-full shadow-sm"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {milestones.filter((m) => m.status === "completed").length} of {milestones.length} milestones
                    </span>
                    <span>
                      {Math.round(
                        (new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )}{" "}
                      days left
                    </span>
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
          )}
          {/* Mobile Header */}
          <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.company} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{client.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">{client.company}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RealtimeNotifications projectId={project.id} userId={currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"} />
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Contact</span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex flex-1 flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
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

                <TabsContent value="dashboard" className="flex-1 overflow-auto mt-0">
                  <ProjectDashboard projectId={project.id} />
                </TabsContent>

                <TabsContent value="current" className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex flex-col space-y-4 overflow-hidden h-full">
                    {/* Milestone progress */}
                    <div className="flex-shrink-0">
                      <SubtleMilestone
                        milestones={milestonesForComponent}
                        onMilestoneClick={handleMilestoneClick}
                        currentMilestone={currentMilestone}
                      />
                    </div>

                    {/* Deliverable header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-l-4 border-l-teal-500 bg-white p-4 rounded-md shadow-sm hover:shadow transition-shadow duration-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-lg font-semibold">
                            {activeMilestone.title}: {activeVersion?.version_name}
                          </h1>
                          <Badge
                            variant="outline"
                            className={
                              activeMilestone.status === "completed"
                                ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border-green-200"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors border-amber-200"
                            }
                          >
                            {activeMilestone.status === "completed" ? "Approved" : "Awaiting Review"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activeVersion?.description || activeMilestone.description}
                        </p>
                      </div>
                      {activeVersions.length > 1 && (
                        <div className="flex items-center gap-2 mt-1 md:mt-0">
                          <HoverVersionSelector
                            versions={versionsForSelector}
                            currentVersion={currentVersion}
                            onVersionChange={handleVersionChange}
                          />
                        </div>
                      )}
                    </div>

                    {/* Main content area - using flex-1 to take all available space */}
                    <div className="flex flex-1 flex-col lg:flex-row gap-4 min-h-0">
                      {/* Left column - File preview */}
                      <div className={`flex-1 ${showComments ? "lg:w-2/3" : "lg:w-full"}`}>
                        <Card className="h-full flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200">
                          <CardHeader className="flex-row items-center justify-between space-y-0 py-3 px-4 border-b">
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
                          <CardContent className="p-0 flex-1">
                            {activeVersion && (
                              <FilePreview
                                fileType={activeVersion.file_type || "image"}
                                fileName={
                                  activeVersion.file_name ||
                                  `${activeMilestone.title}_${activeVersion.version_name}.${activeVersion.file_type === "pdf" ? "pdf" : "png"}`
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
                        <div className="lg:w-1/3 h-full">
                          <Card className="h-full flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200">
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
                          <p className="text-sm font-medium">
                            Delivered on{" "}
                            {activeVersion ? new Date(activeVersion.created_at).toLocaleDateString() : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">Waiting for your approval</p>
                        </div>
                      </div>

                      <ApprovalDialog
                        deliverableId={activeVersion?.id || ""}
                        clientId={client.id}
                        isApproved={activeVersion?.status === "approved"}
                        onApproved={() => {
                          // Dans une application réelle, vous rechargeriez les données ici
                          refreshProjectData()
                        }}
                        onRejected={() => {
                          // Dans une application réelle, vous rechargeriez les données ici
                          refreshProjectData()
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-auto mt-0">
                  <ProjectHistory milestones={milestones} onViewVersion={handleVersionChange} comments={comments} />
                </TabsContent>

                <TabsContent value="my-files" className="flex-1 overflow-auto mt-0">
                  <ProjectFiles
                    files={sharedFiles}
                    projectId={project.id}
                    clientId={client.id}
                    onFileDeleted={refreshProjectData}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
