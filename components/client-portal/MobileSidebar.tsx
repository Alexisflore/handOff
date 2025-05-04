"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BarChart, Clock, History, FileIcon, ChevronLeft, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TabType } from "@/app/projects/[id]/page"
import { CurrentUser } from "./types"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  project: any
  client: any
  freelancer: any
  approvedDeliverables: number
  totalDeliverables: number
  handleLogout: () => Promise<void>
  currentUser: CurrentUser | null
}

export function MobileSidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  project,
  client,
  handleLogout,
  currentUser
}: MobileSidebarProps) {
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    onClose()
  }
  
  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="h-full w-64 bg-white" onClick={(e) => e.stopPropagation()}>
        {/* Mobile sidebar content */}
        <div className="flex h-full flex-col">
          <div className="flex justify-between items-center p-4 border-b">
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mb-4 px-4 pt-4">
            <h3 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            <div className="space-y-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => handleTabChange("dashboard")}
              >
                <BarChart className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant={activeTab === "current" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => handleTabChange("current")}
              >
                <Clock className="h-4 w-4" />
                <span>Current Deliverable</span>
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => handleTabChange("history")}
              >
                <History className="h-4 w-4" />
                <span>Version History</span>
              </Button>
              <Button
                variant={activeTab === "my-files" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => handleTabChange("my-files")}
              >
                <FileIcon className="h-4 w-4" />
                <span>Files</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 h-9 text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </nav>

          {/* Connected User information */}
          <div className="mt-auto p-4 border-t">
            {currentUser && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUser.avatar_url || "/placeholder.svg"}
                    alt={currentUser.full_name || "Utilisateur"}
                  />
                  <AvatarFallback className="bg-teal-100 text-teal-700">
                    {currentUser.full_name ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {currentUser.full_name || (currentUser.isDesigner ? "Designer" : "Client")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 