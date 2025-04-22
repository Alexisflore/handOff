"use client"

import { useState, useEffect } from "react"
import { Check, Clock, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  title: string
  status: "completed" | "current" | "upcoming"
}

interface MilestoneNavigationProps {
  milestones: Milestone[]
  currentMilestone: string
  onMilestoneChange: (milestoneId: string) => void
}

export function MilestoneNavigation({ milestones, currentMilestone, onMilestoneChange }: MilestoneNavigationProps) {
  const [availableMilestones, setAvailableMilestones] = useState<string[]>([])

  // Determine which milestones are available based on the current milestone
  useEffect(() => {
    // Find the index of the current milestone
    const currentIndex = milestones.findIndex((m) => m.id === currentMilestone)

    // All completed milestones and the current one are available
    const available = milestones
      .filter((m, index) => index <= currentIndex || m.status === "completed")
      .map((m) => m.id)

    setAvailableMilestones(available)
  }, [milestones, currentMilestone])

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {milestones.map((milestone, index) => {
          const isAvailable = availableMilestones.includes(milestone.id)
          const isActive = milestone.id === currentMilestone

          return (
            <div key={milestone.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => isAvailable && onMilestoneChange(milestone.id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-teal-100 text-teal-800 font-medium"
                        : isAvailable
                          ? "hover:bg-slate-100 text-slate-700"
                          : "text-slate-400 cursor-not-allowed",
                    )}
                    disabled={!isAvailable}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        isActive
                          ? "bg-teal-500 border-teal-500 text-white"
                          : milestone.status === "completed"
                            ? "border-teal-500 text-teal-500"
                            : "border-slate-300 text-slate-400",
                      )}
                    >
                      {isActive ? (
                        <Clock className="h-3 w-3" />
                      ) : milestone.status === "completed" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </span>
                    <span>{milestone.title}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!isAvailable ? (
                    <p className="text-xs">This milestone will be available after completing the current phase</p>
                  ) : isActive ? (
                    <p className="text-xs">Current milestone</p>
                  ) : (
                    <p className="text-xs">View {milestone.title.toLowerCase()} deliverables</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {index < milestones.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
