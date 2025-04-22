"use client"

import type React from "react"

import { Check, Clock, LockIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  title: string
  status: "completed" | "current" | "upcoming"
  icon?: React.ReactNode
}

interface SubtleMilestoneProps {
  milestones: Milestone[]
  className?: string
  onMilestoneClick?: (milestone: Milestone) => void
  currentMilestone: string
}

export function SubtleMilestone({ milestones, className, onMilestoneClick, currentMilestone }: SubtleMilestoneProps) {
  const currentIndex = milestones.findIndex((m) => m.id === currentMilestone)
  const progress = ((currentIndex + 0.5) / milestones.length) * 100

  const handleClick = (milestone: Milestone) => {
    if (milestone.status === "upcoming") {
      return // Do nothing for upcoming milestones
    }

    if (onMilestoneClick) {
      onMilestoneClick(milestone)
    }
  }

  // Remplacer la fonction getMilestoneIcon par une version simplifiée qui utilise toujours Check pour les milestones complétés
  const getMilestoneIcon = (milestone: Milestone) => {
    if (milestone.icon) return milestone.icon

    // Toujours utiliser Check pour les milestones complétés
    return <Check className="h-3 w-3" />
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Project Progress</h3>
          <span className="text-xs text-muted-foreground">
            Step {currentIndex + 1} of {milestones.length}
          </span>
        </div>

        <div className="relative flex w-full items-center justify-between">
          {/* Progress bar */}
          <div className="absolute left-0 top-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-teal-500 transition-all duration-500 ease-in-out rounded-full shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          {milestones.map((milestone, index) => {
            // Déterminer si le milestone est accessible (tous les complétés + le current sont accessibles)
            const isAccessible =
              milestone.status === "completed" || milestone.id === currentMilestone || milestone.status === "current"

            return (
              <div
                key={milestone.id}
                className={cn(
                  "relative flex flex-col items-center text-center z-10",
                  milestone.id === currentMilestone
                    ? "text-teal-700"
                    : milestone.status === "completed"
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                        milestone.id === currentMilestone
                          ? "border-teal-500 bg-teal-500 text-white shadow-sm"
                          : milestone.status === "completed" || milestone.status === "current"
                            ? "border-teal-500 bg-white shadow-sm cursor-pointer hover:bg-teal-50"
                            : "border-slate-200 bg-white cursor-not-allowed",
                      )}
                      onClick={() => (isAccessible ? handleClick(milestone) : null)}
                    >
                      {milestone.id === currentMilestone ? (
                        <Clock className="h-3 w-3" />
                      ) : milestone.status === "completed" ? (
                        <Check className="h-3 w-3" />
                      ) : milestone.status === "current" && milestone.id !== currentMilestone ? (
                        <Clock className="h-3 w-3 text-teal-500" />
                      ) : (
                        <LockIcon className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {!isAccessible ? (
                      <p className="text-xs">This milestone will be available after completing the current phase</p>
                    ) : milestone.id === currentMilestone ? (
                      <p className="text-xs">Current milestone</p>
                    ) : (
                      <p className="text-xs">View {milestone.title.toLowerCase()} deliverables</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <span
                  className={`text-xs font-medium ${
                    milestone.id === currentMilestone
                      ? "text-teal-700"
                      : milestone.status === "completed" || milestone.status === "current"
                        ? "text-slate-700"
                        : "text-slate-500"
                  }`}
                >
                  {milestone.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
