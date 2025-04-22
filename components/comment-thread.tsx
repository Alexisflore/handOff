"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  versionId?: string
  versionName?: string
  isClient?: boolean
}

interface CommentThreadProps {
  comments: Comment[]
  onSendComment: (content: string) => void
}

export function CommentThread({ comments, onSendComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")

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
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b pb-3 pt-4">
        <CardTitle className="text-base">Comments & Feedback</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4">
        {comments.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">No comments yet for this version.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className={`flex ${comment.isClient ? "flex-row-reverse" : "flex-row"} gap-3`}>
                <Avatar className="h-8 w-8 shrink-0">
                  {comment.author.avatar && (
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                  )}
                  <AvatarFallback>{comment.author.initials}</AvatarFallback>
                </Avatar>
                <div className={`space-y-1 ${comment.isClient ? "items-end text-right" : ""}`}>
                  <div className={`flex items-center gap-2 ${comment.isClient ? "justify-end" : ""}`}>
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    {comment.versionId && (
                      <Badge variant="outline" className="text-xs">
                        v{comment.versionName}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      comment.isClient ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {comment.content}
                  </div>
                  <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type your comment..."
            className="min-h-[80px] flex-1 resize-none"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button size="icon" onClick={handleSendComment} disabled={!newComment.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send comment</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Press Ctrl+Enter to send</p>
      </div>
    </Card>
  )
}
