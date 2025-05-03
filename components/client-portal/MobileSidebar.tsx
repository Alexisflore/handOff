"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BarChart, Clock, History, FileIcon, ChevronLeft, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TabType } from "@/app/projects/[id]/page"

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
}

export function MobileSidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  project,
  client,
  freelancer,
  approvedDeliverables,
  totalDeliverables,
  handleLogout
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

          <div className="px-4 mb-4">
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

          <div className="mt-auto p-4 border-t">
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
  )
} 