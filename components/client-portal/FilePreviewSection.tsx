"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Download, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilePreview } from "@/components/file-preview"
import { EnhancedCommentThread } from "@/components/enhanced-comment-thread"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Version, Comment } from "./types"

interface FilePreviewSectionProps {
  activeVersion: Version | null
  currentMilestone: string
  currentVersion: string
  comments: Comment[]
  onSendComment: (content: string) => Promise<void>
  onVersionChange: (versionId: string) => void
  isDesigner: boolean
  onAddNewVersion: () => void
}

// Type adapté pour les commentaires du thread
interface ThreadComment {
  id: string
  author: {
    name: string
    avatar?: string
    initials: string
  }
  content: string
  timestamp: string
  milestoneId: string
  milestoneName: string
  versionId: string
  versionName?: string
  isClient: boolean
}

export function FilePreviewSection({
  activeVersion,
  currentMilestone,
  currentVersion,
  comments,
  onSendComment,
  onVersionChange,
  isDesigner,
  onAddNewVersion
}: FilePreviewSectionProps) {
  const [showComments, setShowComments] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Effet pour montrer un indicateur de chargement à chaque changement de version
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [currentMilestone, currentVersion])

  // Adapter les commentaires pour le composant EnhancedCommentThread
  const commentsForThread = comments.map((c) => ({
    id: c.id,
    author: {
      name: c.users.full_name,
      avatar: c.users.avatar_url,
      initials: c.users.full_name ? c.users.full_name.charAt(0) : "U",
    },
    content: c.content,
    timestamp: new Date(c.created_at).toLocaleString(),
    milestoneId: currentMilestone,
    milestoneName: c.deliverable_name || "Current Deliverable",
    versionId: c.deliverable_id,
    versionName: c.version_name || activeVersion?.version_name || "",
    isClient: c.is_client,
  })) as ThreadComment[]

  // Fonction pour basculer l'affichage des commentaires
  const toggleComments = () => {
    setShowComments(!showComments)
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-4 h-full max-h-[70vh] overflow-auto">
      {/* Left column - File preview */}
      <div className={`flex-1 ${showComments ? "lg:w-2/3" : "lg:w-full"} flex flex-col h-full`}>
        <Card className={`flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200 overflow-auto h-full ${isLoading ? 'animate-pulse' : ''}`}>
          <CardHeader className="flex-row items-center justify-between space-y-0 py-3 px-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-medium">Preview</CardTitle>
              {/* Version selector dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1.5 text-sm"
                  onClick={() => {
                    const elem = document.getElementById('preview-version-dropdown')
                    if (elem) {
                      elem.classList.toggle('hidden')
                    }
                  }}
                >
                  <span>{activeVersion?.version_name || "Version 1"}</span>
                  {activeVersion?.is_latest && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Latest</Badge>
                  )}
                  <span className="text-xs text-gray-500 mx-1">
                    {activeVersion ? new Date(activeVersion.created_at).toLocaleDateString() : ""}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
                
                {/* Dropdown menu for versions */}
                {activeVersion && (
                  <div 
                    id="preview-version-dropdown"
                    className="absolute left-0 top-full mt-1 z-50 w-72 hidden"
                  >
                    <div className="bg-white rounded-md shadow-lg border border-gray-200 py-1">
                      <div className="px-3 py-2 text-sm flex items-center gap-2 bg-gray-100 font-medium">
                        <span>{activeVersion.version_name || "Version 1"}</span>
                        {activeVersion.is_latest && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">Latest</Badge>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(activeVersion.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton "Add a new version" visible uniquement pour les designers */}
              {isDesigner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1.5 text-sm border-teal-600 text-teal-700 hover:bg-teal-50"
                  onClick={onAddNewVersion}
                >
                  <span>Add a new version</span>
                </Button>
              )}
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
          <CardContent className="p-0 flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full w-full bg-slate-50">
                <div className="text-slate-500 text-center p-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-4">Chargement du livrable...</p>
                </div>
              </div>
            ) : activeVersion ? (
              <FilePreview
                fileType={(activeVersion.file_type === "pdf" ? "pdf" : "image") as "image" | "pdf" | "other"}
                fileName={
                  activeVersion.file_name ||
                  `Deliverable_${activeVersion.version_name}.${activeVersion.file_type === "pdf" ? "pdf" : "png"}`
                }
                fileUrl={
                  activeVersion.file_url ||
                  "/placeholder.svg?height=600&width=450&text=Preview+Not+Available"
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-slate-50">
                <p className="text-slate-500 text-center p-8">Aucun aperçu disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column - Comments */}
      {showComments && (
        <div className="lg:w-1/3 flex flex-col h-full">
          <Card className={`flex flex-col shadow-sm hover:shadow transition-shadow duration-200 border-slate-200 overflow-hidden h-full ${isLoading ? 'animate-pulse' : ''}`}>
            <EnhancedCommentThread
              allComments={commentsForThread as any}
              currentMilestone={currentMilestone}
              currentVersion={currentVersion}
              onSendComment={onSendComment}
              defaultFilter="milestone"
            />
          </Card>
        </div>
      )}
    </div>
  )
} 