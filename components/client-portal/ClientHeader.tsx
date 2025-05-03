"use client"

import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { Deliverable } from "./types"

interface ClientHeaderProps {
  sidebarCollapsed: boolean
  client: any
  activeDeliverable: Deliverable
  refreshProjectData: () => Promise<void>
  isRefreshing: boolean
  currentUser?: any
  toggleDeliverableSelector: () => void
}

export function ClientHeader({
  sidebarCollapsed,
  client,
  activeDeliverable,
  refreshProjectData,
  isRefreshing,
  currentUser,
  toggleDeliverableSelector
}: ClientHeaderProps) {
  return (
    <header className="flex w-full border-b border-slate-200 h-[56px] shrink-0 sticky top-0 z-30 bg-white">
      {/* Partie gauche - Client info */}
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
      
      {/* Partie droite - Titre et contrôles */}
      <div className="flex-1 flex justify-between items-center px-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {activeDeliverable.title}
          </h1>
          
          <Badge
            variant="outline"
            className={
              activeDeliverable.status === "completed"
                ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border-green-200"
                : activeDeliverable.status === "current"
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors border-amber-200" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-600 transition-colors border-slate-200"
            }
          >
            {activeDeliverable.status === "completed" 
              ? "Approved" 
              : activeDeliverable.status === "current" 
                ? "In Progress" 
                : "Upcoming"}
          </Badge>
          
          <Button
            id="toggle-deliverables-button" 
            variant="ghost"
            size="sm"
            className="ml-1 flex items-center gap-1 text-slate-600 hover:text-slate-800"
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
            <span className="text-xs">Tous les livrables</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={refreshProjectData}
            disabled={isRefreshing}
            title="Actualiser"
          >
            {isRefreshing ? 
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            : 
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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