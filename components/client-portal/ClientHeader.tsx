"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { Deliverable } from "./types"

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
  project
}: ClientHeaderProps) {
  const displayItem = activeStep || activeDeliverable;
  const displayTitle = displayItem?.title || "Étape non sélectionnée";
  const displayStatus = displayItem?.status || "pending";

  return (
    <header className="flex w-full border-b border-slate-200 h-[56px] shrink-0 sticky top-0 z-30 bg-white">
      {/* Client logo section */}
      <div 
        className={`flex ${
          sidebarCollapsed ? "w-16 justify-center" : "w-64 items-center gap-3"
        } px-4 border-r border-slate-200 bg-slate-50 overflow-hidden h-[56px]`}
      >
        <Avatar className={`${sidebarCollapsed ? "h-8 w-8" : "h-10 w-10"} flex-shrink-0`}>
          <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.company} />
          <AvatarFallback className="bg-blue-100 text-blue-700">{client.initials}</AvatarFallback>
        </Avatar>
        <div className={`transition-opacity duration-200 ${sidebarCollapsed ? "hidden" : "block"}`}>
          <p className="font-medium text-sm truncate">{client.company}</p>
          <p className="text-xs text-muted-foreground truncate">{client.name}</p>
        </div>
      </div>
      
      {/* Main header content */}
      <div className="flex-1 flex justify-between items-center px-4 overflow-hidden">
        {/* Project & deliverable breadcrumb */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <span className="text-base font-medium text-slate-800 max-w-[200px] truncate">{project.title}</span>
            <Badge variant="outline" className="ml-2 bg-blue-50/50 text-blue-700 border-blue-100 hover:bg-blue-50 text-xs">
              {project.status === "in_progress" ? "In Progress" : project.status}
            </Badge>
          </div>
          
          <ChevronRight className="h-4 w-4 mx-1.5 text-slate-400 flex-shrink-0" />
          
          <div className="flex items-center">
            <span className="text-base font-medium text-slate-800 max-w-[200px] truncate">{displayTitle}</span>
            <Badge
              variant="outline"
              className={`ml-2 text-xs border-opacity-50 ${
                displayStatus === "completed"
                  ? "bg-green-50/50 text-green-700 border-green-100"
                  : displayStatus === "current"
                    ? "bg-amber-50/50 text-amber-700 border-amber-100" 
                    : "bg-slate-50/50 text-slate-500 border-slate-100"
              }`}
            >
              {displayStatus === "completed" 
                ? "Terminée" 
                : displayStatus === "current" 
                  ? "En cours" 
                  : "À venir"}
            </Badge>
          </div>
          
          <Button
            id="toggle-deliverables-button" 
            variant="ghost"
            size="sm"
            className="ml-2 flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100/70 rounded-md px-2"
            onClick={() => {
              toggleDeliverableSelector();
              setTimeout(() => {
                const tabContent = document.querySelector('[data-state="active"]');
                if (tabContent) {
                  tabContent.scrollTop = 0;
                }
              }, 50);
            }}
          >
            <span className="text-xs">Toutes les étapes</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100/70"
            onClick={refreshProjectData}
            disabled={isRefreshing}
            title="Actualiser"
          >
            {isRefreshing ? 
              <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            : 
              <svg className="h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          </Button>
          <RealtimeNotifications projectId={client.project_id} userId={currentUser?.id || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"} />
        </div>
      </div>
    </header>
  )
} 