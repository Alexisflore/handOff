"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, PaperclipIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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

interface EnhancedCommentThreadProps {
  allComments: Comment[]
  currentMilestone: string
  currentVersion: string
  onSendComment: (content: string) => void
}

export function EnhancedCommentThread({
  allComments,
  currentMilestone,
  currentVersion,
  onSendComment,
}: EnhancedCommentThreadProps) {
  const [newComment, setNewComment] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<"milestone" | "all">("milestone")

  // Filter comments based on the selected filter
  const filteredComments =
    filter === "all" ? [...allComments] : allComments.filter((comment) => comment.milestoneId === currentMilestone)

  // Sort comments by timestamp (oldest first)
  const sortedComments = filteredComments.sort((a, b) => {
    const dateA = new Date(a.timestamp.split("•")[0].trim()).getTime()
    const dateB = new Date(b.timestamp.split("•")[0].trim()).getTime()
    return dateA - dateB
  })

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [sortedComments])

  const handleSendComment = () => {
    if (newComment.trim()) {
      onSendComment(newComment)
      setNewComment("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSendComment()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="border-b py-3 px-4 flex-shrink-0 bg-slate-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Discussion</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-7 text-xs px-2 transition-colors"
              data-filter="all"
            >
              All Project
            </Button>
            <Button
              variant={filter === "milestone" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("milestone")}
              className="h-7 text-xs px-2 font-medium transition-colors"
              data-filter="deliverable"
            >
              This Milestone
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Scrollable message area that takes available space */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-0 h-full">
            {sortedComments.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No comments yet for this project.</p>
                  <p className="text-xs text-muted-foreground mt-1">Start the conversation with your designer.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {sortedComments.map((comment) => (
                  <div key={comment.id} className={`${comment.isClient ? "items-end" : ""}`}>
                    <div className={`${comment.isClient ? "flex flex-col items-end" : "flex flex-col"}`}>
                      <div className={`flex items-center gap-1.5 ${comment.isClient ? "justify-end" : ""} mb-1`}>
                        <span className="text-xs font-medium">{comment.author.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${
                            comment.milestoneId === currentMilestone ? "bg-blue-50 text-blue-700 hover:bg-blue-50" : ""
                          }`}
                        >
                          {comment.milestoneName} • {comment.versionName}
                        </Badge>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                          comment.isClient
                            ? "ml-auto bg-teal-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-foreground shadow-sm"
                        }`}
                      >
                        {comment.content}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{comment.timestamp.split("•")[1]}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </div>

        {/* Input area always at the bottom */}
        <div className="border-t p-3 mt-auto flex-shrink-0">
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Type your comment..."
              className="min-h-[80px] resize-none text-sm focus:border-teal-300 focus:ring-teal-300 transition-colors"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs hover:bg-slate-50 transition-colors">
                <PaperclipIcon className="h-3.5 w-3.5" />
                <span>Attach</span>
              </Button>
              <Button
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="h-8 gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 transition-colors disabled:bg-slate-300"
                size="sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-right">Press Ctrl+Enter to send</p>
        </div>
      </div>
    </div>
  )
}
