"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, ChevronDown, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Comment {
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
  versionName: string
  isClient?: boolean
}

interface CommentThreadProps {
  allComments: Comment[]
  currentMilestone: string
  currentVersion: string
  onSendComment: (content: string) => Promise<void>
  defaultFilter?: "milestone" | "deliverable"
}

export function CommentThread({
  allComments,
  currentMilestone,
  currentVersion,
  onSendComment,
  defaultFilter = "milestone"
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<"milestone" | "deliverable">(defaultFilter)

  // Débogage des props reçues
  useEffect(() => {
    console.log("[CommentThread DEBUG] Props reçues:", {
      totalComments: allComments.length,
      currentMilestone,
      currentVersion,
      defaultFilter,
      filter
    });

    // Afficher les IDs de tous les commentaires et leurs milestoneId et versionId
    console.log("[CommentThread DEBUG] Liste de TOUS les commentaires disponibles:", 
      allComments.map(c => ({
        id: c.id,
        milestoneId: c.milestoneId,
        versionId: c.versionId,
        content: c.content.substring(0, 20) + (c.content.length > 20 ? '...' : '')
      }))
    );
  }, [allComments, currentMilestone, currentVersion, defaultFilter, filter]);

  // Reset to top of messages when version changes
  useEffect(() => {
    console.log("[CommentThread] Version changed:", currentVersion);
    
    if (filter === "deliverable") {
      // Scroll to top when changing to a different deliverable's comments
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = 0;
      }
    }
  }, [currentVersion, filter]);

  // Recalculate filtered comments when currentVersion changes
  const filteredComments = useMemo(() => {
    if (filter === "milestone") {
      // En mode "Toute l'étape", on affiche tous les commentaires du step actuel, tous livrables confondus
      console.log("[CommentThread] Affichage de TOUS les commentaires du step:", currentMilestone);
      const stepComments = allComments.filter((comment) => comment.milestoneId === currentMilestone);
      console.log("[CommentThread] Nombre de commentaires dans cette étape:", stepComments.length);
      return stepComments;
    } else {
      // En mode "Ce livrable", on n'affiche que les commentaires du livrable actuel
      console.log("[CommentThread] Affichage des commentaires du livrable spécifique:", currentVersion);
      const deliverableComments = allComments.filter(
        (comment) => comment.milestoneId === currentMilestone && comment.versionId === currentVersion
      );
      console.log("[CommentThread] Nombre de commentaires pour ce livrable:", deliverableComments.length);
      return deliverableComments;
    }
  }, [filter, allComments, currentMilestone, currentVersion]);

  // Sort comments by timestamp (oldest first)
  const sortedComments = useMemo(() => {
    return [...filteredComments].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
  }, [filteredComments]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [sortedComments])

  const handleSendComment = async () => {
    if (newComment.trim() && !isSubmitting) {
      setIsSubmitting(true)
      try {
        await onSendComment(newComment)
        setNewComment("")
      } catch (error) {
        console.error("Failed to send comment:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSendComment()
    }
  }

  return (
    <Card className="flex flex-col h-full border border-slate-200 shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b bg-white">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Discussion</h3>
          <Badge variant="outline" className="text-xs bg-slate-50">
            {filteredComments.length} message{filteredComments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
              <FilterIcon className="h-3 w-3" />
              <span>{filter === "milestone" ? "Toute l'étape" : "Ce livrable"}</span>
              <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem 
              className={`text-xs ${filter === "milestone" ? "font-medium" : ""}`}
              onClick={() => setFilter("milestone")}
            >
              Toute l'étape
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs ${filter === "deliverable" ? "font-medium" : ""}`}
              onClick={() => setFilter("deliverable")}
            >
              Ce livrable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto">
        {sortedComments.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center max-w-[200px]">
              <p className="text-sm text-slate-600 font-medium mb-1">No comments yet</p>
              <p className="text-xs text-slate-500">Start the conversation by sending a message below.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {sortedComments.map((comment) => (
              <div 
                key={comment.id} 
                className={`flex ${comment.isClient ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${comment.isClient ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                    <AvatarFallback className={comment.isClient ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}>
                      {comment.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <div className={`flex items-center gap-1.5 ${comment.isClient ? "justify-end" : ""} mb-1`}>
                      <span className="text-xs font-medium">{comment.author.name}</span>
                      {filter === "milestone" && comment.versionId !== currentVersion && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-default">
                          {comment.versionName}
                        </Badge>
                      )}
                    </div>
                    
                    <div
                      className={`relative rounded-lg px-3.5 py-2.5 text-sm ${
                        comment.isClient
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div
                        className={`absolute top-2 ${
                          comment.isClient ? "right-full mr-1" : "left-full ml-1"
                        } hidden`}
                      >
                        {/* Triangle shape for speech bubble using border */}
                        <div
                          className={`h-0 w-0 border-4 border-transparent ${
                            comment.isClient
                              ? "border-r-teal-600"
                              : "border-l-slate-100"
                          }`}
                        />
                      </div>
                      {comment.content}
                    </div>
                    
                    <p className={`text-[11px] text-slate-500 mt-1 ${comment.isClient ? "text-right" : "text-left"}`}>
                      {typeof comment.timestamp === "string" ? 
                        new Date(comment.timestamp.split(",")[0]).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        "Unknown time"
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-white">
        <div className="flex flex-col gap-2 w-full">
          <Textarea
            placeholder="Type your message..."
            className="min-h-[80px] resize-none text-sm border-slate-200 focus-visible:ring-teal-500 focus-visible:ring-offset-0"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Press Ctrl+Enter to send</p>
            <Button
              onClick={handleSendComment}
              disabled={!newComment.trim() || isSubmitting}
              className="h-8 gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 transition-colors"
              size="sm"
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Send</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 