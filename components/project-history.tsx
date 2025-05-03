"use client"

import { useState } from "react"
import { Check, ChevronDown, Clock, Eye, MessageSquare, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface HistoryProps {
  milestones: any[]
  onViewVersion: (versionId: string) => void
  comments: any[]
}

export function ProjectHistory({ milestones, onViewVersion, comments }: HistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "approved" | "current">("all")

  // Filter milestones based on search and filter
  const filteredMilestones = milestones
    .filter((m) => m.versions && m.versions.length > 0)
    .filter((m) => {
      if (filter === "approved") return m.status === "completed"
      if (filter === "current") return m.status === "current"
      return true
    })
    .filter((m) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        (m.versions &&
          m.versions.some(
            (v) =>
              v.title.toLowerCase().includes(query) || (v.description && v.description.toLowerCase().includes(query)),
          ))
      )
    })

  // Get comments for a specific version
  const getCommentsForVersion = (versionId: string) => {
    return comments.filter((c) => c.deliverable_id === versionId)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-3 w-full">
      {/* Header with search and filters */}
      <div className="space-y-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div>
            <h2 className="text-xl font-semibold">Project Timeline</h2>
            <p className="text-sm text-muted-foreground">View all versions and their feedback</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-8"
            >
              All
            </Button>
            <Button
              variant={filter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("approved")}
              className="h-8"
            >
              Approved
            </Button>
            <Button
              variant={filter === "current" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("current")}
              className="h-8"
            >
              Current
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search versions..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {filteredMilestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No versions found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? "Try adjusting your search or filters to find what you're looking for."
                : "There are no versions available for the selected filters."}
            </p>
          </div>
        ) : (
          filteredMilestones.map((milestone) => (
            <Collapsible key={milestone.id} defaultOpen={milestone.status === "current"}>
              <div className="relative">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                        milestone.status === "completed"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : milestone.status === "current"
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-50 text-slate-500",
                      )}
                    >
                      {milestone.status === "completed" ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{milestone.title}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            milestone.status === "completed"
                              ? "bg-green-50 text-green-700 hover:bg-green-50"
                              : milestone.status === "current"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-50",
                          )}
                        >
                          {milestone.status === "completed"
                            ? "Approved"
                            : milestone.status === "current"
                              ? "In Progress"
                              : "Upcoming"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>

                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>

                {/* Vertical line connecting milestones */}
                {milestone.id !== filteredMilestones[filteredMilestones.length - 1].id && (
                  <div className="absolute left-7 top-16 h-[calc(100%-3.5rem)] w-0.5 bg-muted" />
                )}
              </div>

              <CollapsibleContent>
                <div className="ml-14 space-y-4 pt-2 pb-6">
                  {milestone.versions &&
                    milestone.versions.map((version: any, index: number) => {
                      const versionComments = getCommentsForVersion(version.id)
                      return (
                        <Card
                          key={version.id}
                          className={cn(
                            "overflow-hidden transition-all hover:shadow",
                            version.is_latest && "border-teal-200 bg-teal-50/30",
                          )}
                        >
                          <CardContent className="p-0">
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{version.version_name}</h4>
                                  {version.is_latest && (
                                    <Badge variant="outline" className="bg-teal-50 text-teal-700 hover:bg-teal-50">
                                      Latest
                                    </Badge>
                                  )}
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
                                    {version.status === "approved"
                                      ? "Approved"
                                      : version.status === "rejected"
                                        ? "Rejected"
                                        : "Pending"}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5"
                                  onClick={() => onViewVersion(version.id)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </Button>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <span>{formatDate(version.created_at)}</span>
                                {versionComments.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>
                                        {versionComments.length} comment{versionComments.length !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <p className="text-sm">{version.description}</p>

                              {/* Preview thumbnail if available */}
                              {version.file_url && version.file_type === "image" && (
                                <div className="mt-3 rounded-md border overflow-hidden bg-white">
                                  <img
                                    src={version.file_url || "/placeholder.svg"}
                                    alt={`Preview of ${version.title}`}
                                    className="w-full h-32 object-contain"
                                  />
                                </div>
                              )}

                              {/* Comments preview */}
                              {versionComments.length > 0 && (
                                <div className="mt-3">
                                  <Separator className="my-3" />
                                  <div className="space-y-3">
                                    {versionComments.slice(0, 2).map((comment) => (
                                      <div key={comment.id} className="flex items-start gap-2">
                                        <Avatar className="h-6 w-6">
                                          {comment.users?.avatar_url && (
                                            <AvatarImage
                                              src={comment.users.avatar_url || "/placeholder.svg"}
                                              alt={comment.users.full_name}
                                            />
                                          )}
                                          <AvatarFallback className="text-xs">
                                            {comment.is_client ? "CL" : "DS"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium">
                                              {comment.users?.full_name || (comment.is_client ? "Client" : "Designer")}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {formatDate(comment.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground line-clamp-1">
                                            {comment.content}
                                          </p>
                                        </div>
                                      </div>
                                    ))}

                                    {versionComments.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-xs"
                                        onClick={() => onViewVersion(version.id)}
                                      >
                                        View all {versionComments.length} comments
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  )
}
