"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Version {
  id: string
  name: string
  date: string
  isLatest?: boolean
}

interface HoverVersionSelectorProps {
  versions: Version[]
  currentVersion: string
  onVersionChange: (versionId: string) => void
}

export function HoverVersionSelector({ versions, currentVersion, onVersionChange }: HoverVersionSelectorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Reverse the versions array to display newest first
  const reversedVersions = [...versions].reverse()

  // Find the current version index in the reversed array
  const currentIndex = reversedVersions.findIndex((v) => v.id === currentVersion)
  const current = reversedVersions[currentIndex]

  // In the reversed array, "next" means older (higher index) and "previous" means newer (lower index)
  const hasNewer = currentIndex > 0
  const hasOlder = currentIndex < reversedVersions.length - 1

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Inverser les fonctions des flèches pour qu'elles correspondent à l'ordre chronologique
  // La flèche gauche doit afficher les versions précédentes (plus anciennes)
  // La flèche droite doit afficher les versions suivantes (plus récentes)

  // Remplacer les fonctions handleNewerVersion et handleOlderVersion
  const handlePreviousVersion = () => {
    if (hasNewer) {
      onVersionChange(reversedVersions[currentIndex - 1].id)
    }
  }

  const handleNextVersion = () => {
    if (hasOlder) {
      onVersionChange(reversedVersions[currentIndex + 1].id)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white border rounded-md p-1 shadow-sm hover:shadow transition-shadow duration-200">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-slate-900 transition-colors"
        onClick={handlePreviousVersion}
        disabled={!hasNewer}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div ref={menuRef} className="relative">
        <Button
          variant="ghost"
          className="h-8 gap-2 px-3 text-sm font-medium hover:bg-slate-50 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <History className="h-4 w-4 text-teal-500" />
          <span>{current.name}</span>
          {current.isLatest && (
            <Badge
              variant="outline"
              className="ml-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 transition-colors"
            >
              Latest
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>

        {isMenuOpen && (
          <div className="absolute left-0 z-10 mt-1 w-48 origin-top-left rounded-md border bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {reversedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${
                    version.id === currentVersion ? "bg-slate-100" : "hover:bg-slate-50"
                  } transition-colors`}
                  onClick={() => {
                    onVersionChange(version.id)
                    setIsMenuOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{version.name}</span>
                    <span className="text-xs text-muted-foreground">{version.date}</span>
                  </div>
                  {version.isLatest && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 transition-colors"
                    >
                      Latest
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-slate-900 transition-colors"
        onClick={handleNextVersion}
        disabled={!hasOlder}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
