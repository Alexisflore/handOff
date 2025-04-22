"use client"
import { ChevronDown, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Version {
  id: string
  name: string
  date: string
  isLatest?: boolean
  isCurrent?: boolean
}

interface VersionSelectorProps {
  versions: Version[]
  currentVersion: string
  onVersionChange: (versionId: string) => void
}

export function VersionSelector({ versions, currentVersion, onVersionChange }: VersionSelectorProps) {
  const current = versions.find((v) => v.id === currentVersion) || versions[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>{current.name}</span>
            {current.isLatest && (
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                Latest
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Version History</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions.map((version) => (
          <DropdownMenuItem
            key={version.id}
            className={version.id === currentVersion ? "bg-muted" : ""}
            onClick={() => onVersionChange(version.id)}
          >
            <div className="flex w-full items-center justify-between">
              <span>{version.name}</span>
              <div className="flex items-center gap-2">
                {version.isLatest && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    Latest
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{version.date}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
