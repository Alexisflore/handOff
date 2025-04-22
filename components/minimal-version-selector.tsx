"use client"

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Version {
  id: string
  name: string
  date: string
  isLatest?: boolean
}

interface MinimalVersionSelectorProps {
  versions: Version[]
  currentVersion: string
  onVersionChange: (versionId: string) => void
}

export function MinimalVersionSelector({ versions, currentVersion, onVersionChange }: MinimalVersionSelectorProps) {
  const currentIndex = versions.findIndex((v) => v.id === currentVersion)
  const current = versions[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < versions.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      onVersionChange(versions[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onVersionChange(versions[currentIndex + 1].id)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={handlePrevious}
        disabled={!hasPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-1 px-2 text-sm font-normal">
            <span>{current.name}</span>
            {current.isLatest && (
              <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 hover:bg-green-50">
                Latest
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              className={version.id === currentVersion ? "bg-muted" : ""}
              onClick={() => onVersionChange(version.id)}
            >
              <div className="flex w-full items-center justify-between">
                <span>{version.name}</span>
                {version.isLatest && (
                  <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 hover:bg-green-50">
                    Latest
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={handleNext}
        disabled={!hasNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
