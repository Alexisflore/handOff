"use client"

import { MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VersionHistoryProps {
  versions: {
    id: string
    name: string
    date: string
    description: string
    status: "approved" | "rejected" | "pending"
    comments: {
      id: string
      author: {
        name: string
        avatar?: string
        initials: string
      }
      content: string
      timestamp: string
      isClient?: boolean
    }[]
  }[]
  onViewVersion: (versionId: string) => void
}

export function EnhancedHistory({ versions, onViewVersion }: VersionHistoryProps) {
  return (
    <div className="space-y-8">
      {versions.map((version) => (
        <Card key={version.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{version.name}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    version.status === "approved"
                      ? "bg-green-50 text-green-700 hover:bg-green-50"
                      : version.status === "rejected"
                        ? "bg-red-50 text-red-700 hover:bg-red-50"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                  }
                >
                  {version.status === "approved" ? "Approved" : version.status === "rejected" ? "Rejected" : "Pending"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => onViewVersion(version.id)}>
                View Version
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{version.date}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <p className="text-sm">{version.description}</p>
            </div>

            {version.comments.length > 0 && (
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Conversation History</h3>
                </div>
                <div className="space-y-4">
                  {version.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`flex ${comment.isClient ? "flex-row-reverse" : "flex-row"} gap-3`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {comment.author.avatar && (
                          <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                        )}
                        <AvatarFallback>{comment.author.initials}</AvatarFallback>
                      </Avatar>
                      <div className={`space-y-1 ${comment.isClient ? "items-end text-right" : ""}`}>
                        <div className={`flex items-center gap-2 ${comment.isClient ? "justify-end" : ""}`}>
                          <span className="text-sm font-medium">{comment.author.name}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            comment.isClient
                              ? "ml-auto bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {comment.content}
                        </div>
                        <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
