"use client"

import { BarChart, Clock, History, FileIcon, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CurrentUser } from "./types"
import { TabType } from "@/app/projects/[id]/page"

interface ClientSidebarProps {
  project: any
  client: any
  freelancer: any
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  approvedDeliverables: number
  totalDeliverables: number
  handleLogout: () => Promise<void>
  currentUser: CurrentUser | null
}

export function ClientSidebar({
  project,
  freelancer,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  approvedDeliverables,
  totalDeliverables,
  handleLogout,
  currentUser
}: ClientSidebarProps) {
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Add debugging log
  console.log("🔍 ClientSidebar: currentUser received:", currentUser);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      } flex-col border-r bg-white md:flex hidden relative`}
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 pt-5 px-4 pb-4">
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
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-${sidebarCollapsed ? "center" : "start"} gap-2 h-9 text-sm text-red-500 hover:text-red-600 hover:bg-red-50`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className={sidebarCollapsed ? "hidden" : "block"}>Déconnexion</span>
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right">Déconnexion</TooltipContent>}
            </Tooltip>
          </div>
        </nav>

        {/* Connected User information */}
        <div className="mt-auto p-4 border-t bg-slate-50">
          {currentUser ? (
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={currentUser.avatar_url || "/placeholder.svg"}
                  alt={currentUser.full_name || "Utilisateur"}
                />
                <AvatarFallback className="bg-teal-100 text-teal-700">
                  {currentUser.full_name ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className={`transition-opacity duration-200 ${sidebarCollapsed ? "hidden" : "block"}`}>
                <p className="text-sm font-medium">
                  {currentUser.full_name || freelancer?.users?.full_name || (currentUser.isDesigner ? "Designer" : "Client")}
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
              <p className="text-sm text-gray-400">Non connecté</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
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
  )
} 