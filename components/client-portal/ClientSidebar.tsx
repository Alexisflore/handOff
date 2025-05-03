"use client"

import { BarChart, Clock, History, FileIcon, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CurrentUser } from "./types"

interface ClientSidebarProps {
  project: any
  client: any
  freelancer: any
  activeTab: string
  setActiveTab: (tab: string) => void
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

        {/* Deliverables info */}
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