import { Check, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  title: string
  description: string
  date: string
  status: "completed" | "current" | "upcoming"
}

interface MilestoneTimelineProps {
  milestones: Milestone[]
  className?: string
}

export function MilestoneTimeline({ milestones, className }: MilestoneTimelineProps) {
  const currentIndex = milestones.findIndex((m) => m.status === "current")
  const progress = ((currentIndex + 0.5) / milestones.length) * 100

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Project Milestones</h3>
          <span className="text-sm text-muted-foreground">
            Step {currentIndex + 1} of {milestones.length}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative pl-8">
            {/* Connecting line */}
            {index < milestones.length - 1 && (
              <div
                className={cn(
                  "absolute left-[15px] top-6 h-full w-0.5",
                  milestone.status === "completed"
                    ? "bg-primary"
                    : milestone.status === "current"
                      ? "bg-gradient-to-b from-primary to-slate-200"
                      : "bg-slate-200",
                )}
              />
            )}

            {/* Status indicator */}
            <div
              className={cn(
                "absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2",
                milestone.status === "completed"
                  ? "border-primary bg-primary text-primary-foreground"
                  : milestone.status === "current"
                    ? "border-primary bg-white"
                    : "border-slate-200 bg-white",
              )}
            >
              {milestone.status === "completed" ? (
                <Check className="h-4 w-4" />
              ) : milestone.status === "current" ? (
                <Clock className="h-4 w-4 text-primary" />
              ) : (
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div
              className={cn(
                "space-y-1",
                milestone.status === "current"
                  ? "text-primary"
                  : milestone.status === "upcoming"
                    ? "text-muted-foreground"
                    : "",
              )}
            >
              <h4 className="text-sm font-medium">{milestone.title}</h4>
              <p className="text-xs">{milestone.description}</p>
              <p className="text-xs text-muted-foreground">{milestone.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
