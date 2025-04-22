"use client"

import { MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface VersionHistoryCardProps {
  version: {
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
    }[]
  }
  onViewVersion: (versionId: string) => void
}

export function VersionHistoryCard({ version, onViewVersion }: VersionHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{version.name}</CardTitle>
            <CardDescription>{version.date}</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>{version.description}</p>
          </div>

          {version.comments.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                <span>Conversation ({version.comments.length})</span>
              </div>
              <div className="space-y-3">
                {version.comments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      {comment.author.avatar && (
                        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                      )}
                      <AvatarFallback className="text-xs">{comment.author.initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {version.comments.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{version.comments.length - 2} more comments</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Button variant="outline" className="w-full" onClick={() => onViewVersion(version.id)}>
          View Version
        </Button>
      </CardFooter>
    </Card>
  )
}
