"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { Deliverable } from "./types"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useClients, Client } from "@/hooks/useClients"
import { useClientProjects, Project } from "@/hooks/useClientProjects"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddButton } from "@/components/ui/add-button"
import { BreadcrumbButton } from "@/components/ui/breadcrumb-button"
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb-separator"

interface ClientHeaderProps {
  sidebarCollapsed: boolean
  client: any
  activeDeliverable: Deliverable
  activeStep?: any
  refreshProjectData: () => Promise<void>
  isRefreshing: boolean
  currentUser?: any
  toggleDeliverableSelector: () => void
  project: any
  activeTab: string
}

export function ClientHeader({
  sidebarCollapsed,
  client,
  activeDeliverable,
  activeStep,
  refreshProjectData,
  isRefreshing,
  currentUser,
  toggleDeliverableSelector,
  project,
  activeTab
}: ClientHeaderProps) {
  const displayItem = activeStep || activeDeliverable;
  const displayTitle = displayItem?.title || "Étape non sélectionnée";
  const displayStatus = displayItem?.status || "pending";
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(client?.id || null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(project?.id || null);
  
  const { clients, isLoading: isLoadingClients } = useClients(
    currentUser?.id, 
    currentUser?.isDesigner,
    client
  );
  
  const { projects, isLoading: isLoadingProjects } = useClientProjects(
    selectedClientId,
    project
  );
  
  const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false);
  const [isProjectPopoverOpen, setIsProjectPopoverOpen] = useState(false);
  
  // Update selectedClientId when client changes
  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client]);
  
  // Update selectedProjectId when project changes
  useEffect(() => {
    if (project?.id) {
      setSelectedProjectId(project.id);
    }
  }, [project]);
  
  const handleClientSelect = (clientId: string) => {
    if (clientId === selectedClientId) {
      setIsClientPopoverOpen(false);
      return;
    }
    
    setSelectedClientId(clientId);
    setIsClientPopoverOpen(false);
    
    // If this client has projects, select the first one
    setTimeout(() => {
      const clientProjects = projects.filter(p => p.client_id === clientId);
      if (clientProjects.length > 0) {
        handleProjectSelect(clientProjects[0].id);
      }
    }, 100);
  };
  
  const handleProjectSelect = (projectId: string) => {
    if (projectId === selectedProjectId) {
      setIsProjectPopoverOpen(false);
      return;
    }
    
    setSelectedProjectId(projectId);
    setIsProjectPopoverOpen(false);
    
    // Redirect to the selected project
    window.location.href = `/projects/${projectId}`;
  };
  
  const selectedClient = clients.find(c => c.id === selectedClientId) || client;
  const selectedProject = projects.find(p => p.id === selectedProjectId) || project;

  return (
    <header className="flex w-full border-b border-slate-200 h-[60px] shrink-0 sticky top-0 z-30 bg-white shadow-sm">
      {/* Main header content */}
      <div className="flex-1 flex justify-between items-center px-4 overflow-hidden">
        {/* Project & deliverable breadcrumb */}
        <div className="flex items-center gap-0">
          {/* Client selector (only for designers) */}
          {currentUser?.isDesigner && (
            <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
              <PopoverTrigger asChild>
                <div>
                  <BreadcrumbButton
                    label={selectedClient?.company || "Client"}
                    showDropdownIndicator
                    isDropdownOpen={isClientPopoverOpen}
                    icon={
                      <Avatar className="h-7 w-7 ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all">
                        <AvatarImage src={selectedClient?.logo_url || "/placeholder.svg"} alt={selectedClient?.company} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-medium">{selectedClient?.initials}</AvatarFallback>
                      </Avatar>
                    }
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 shadow-lg rounded-xl border-slate-200" align="start">
                <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
                  <h3 className="text-sm font-medium text-slate-700">Clients</h3>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {isLoadingClients ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="animate-spin h-5 w-5 text-slate-500" />
                      </div>
                    ) : (
                      <>
                        {clients.map((clientItem) => (
                          <Button
                            key={clientItem.id}
                            variant={clientItem.id === selectedClientId ? "secondary" : "ghost"}
                            className={`w-full justify-start rounded-lg py-2 px-3 transition-all ${clientItem.id === selectedClientId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
                            onClick={() => handleClientSelect(clientItem.id)}
                          >
                            <Avatar className="h-6 w-6 mr-2 ring-1 ring-slate-200">
                              <AvatarImage src={clientItem.logo_url || "/placeholder.svg"} alt={clientItem.company} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-medium">{clientItem.initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{clientItem.company}</span>
                          </Button>
                        ))}
                        <AddButton 
                          label="Ajouter un client"
                          onClick={() => {}}
                          style="compact"
                          className="w-full mt-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          iconSize={12}
                        />
                      </>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
          
          {(currentUser?.isDesigner || clients.length > 0) && (
            <BreadcrumbSeparator />
          )}
          
          {/* Project selector */}
          <Popover open={isProjectPopoverOpen} onOpenChange={setIsProjectPopoverOpen}>
            <PopoverTrigger asChild>
              <div>
                <BreadcrumbButton
                  label={selectedProject?.title || "Projet"}
                  showDropdownIndicator
                  isDropdownOpen={isProjectPopoverOpen}
                  badge={{
                    text: selectedProject?.status === "in_progress" ? "En cours" : selectedProject?.status,
                    status: selectedProject?.status
                  }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2 shadow-lg rounded-xl border-slate-200" align="start">
              <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
                <h3 className="text-sm font-medium text-slate-700">Projets</h3>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {isLoadingProjects ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="animate-spin h-5 w-5 text-slate-500" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-sm text-center py-4 text-slate-500">Aucun projet disponible</div>
                  ) : (
                    <>
                      {projects.map((projectItem) => (
                        <Button
                          key={projectItem.id}
                          variant="ghost"
                          className={`w-full justify-start rounded-lg py-2 px-3 transition-all ${projectItem.id === selectedProjectId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
                          onClick={() => handleProjectSelect(projectItem.id)}
                        >
                          <span className="truncate font-medium">{projectItem.title}</span>
                          <Badge
                            variant="outline"
                            className={`ml-auto text-xs border px-2 py-0.5 ${projectItem.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                          >
                            {projectItem.status}
                          </Badge>
                        </Button>
                      ))}
                      <AddButton 
                        label="Ajouter un projet"
                        onClick={() => {}}
                        style="compact"
                        className="w-full mt-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        iconSize={12}
                      />
                    </>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          
          {activeTab === "current" && (
            <>
              <BreadcrumbSeparator />
              
              <BreadcrumbButton
                label={displayTitle}
                showDropdownIndicator
                onClick={toggleDeliverableSelector}
                badge={{
                  text: displayStatus === "completed" 
                    ? "Terminée" 
                    : displayStatus === "current" 
                      ? "En cours" 
                      : "À venir",
                  status: displayStatus
                }}
              />
            </>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 transition-all hover:shadow-sm"
            onClick={refreshProjectData}
            disabled={isRefreshing}
            title="Actualiser"
          >
            {isRefreshing ? 
              <RefreshCw className="animate-spin h-4 w-4 text-slate-600" />
            : 
              <RefreshCw className="h-4 w-4 text-slate-600" />
            }
          </Button>
          <RealtimeNotifications projectId={client.project_id} userId={currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"} />
        </div>
      </div>
    </header>
  )
} 