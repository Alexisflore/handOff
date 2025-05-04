"use client"

import { PlusCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AddButtonProps {
  label: string
  onClick: (e: React.MouseEvent) => void
  tooltipText?: string
  className?: string
  iconSize?: number
  style?: "normal" | "compact" | "icon-only" | "circle"
  color?: "blue" | "teal"
}

export function AddButton({
  label,
  onClick,
  tooltipText,
  className = "",
  iconSize = 8,
  style = "normal",
  color = "blue"
}: AddButtonProps) {
  // Couleur de l'icône en fonction de la prop color
  const iconColor = color === "blue" ? "text-blue-500" : "text-teal-600";
  
  // Style icon-only pour une version minimaliste (seulement une icône sans bordure)
  if (style === "icon-only") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`flex items-center justify-center p-1.5 hover:bg-slate-50 rounded-md ${className}`}
          >
            <PlusCircle className={`h-${iconSize} w-${iconSize} ${iconColor}`} />
            <span className="sr-only">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltipText || label}</TooltipContent>
      </Tooltip>
    )
  }
  
  // Style circle pour un bouton rond avec bordure (comme dans l'image)
  if (style === "circle") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`flex items-center justify-center p-1.5 rounded-full border-2 border-teal-600 text-teal-700 hover:bg-teal-50 ${className}`}
          >
            <PlusCircle className={`h-${iconSize/2} w-${iconSize/2} ${iconColor}`} />
            <span className="sr-only">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{tooltipText || label}</TooltipContent>
      </Tooltip>
    )
  }
  
  // Style compact pour un bouton moins imposant
  if (style === "compact") {
    return (
      <button
        onClick={onClick}
        className={`group flex items-center justify-center gap-2 py-1.5 px-3 transition-all duration-150 bg-white hover:bg-blue-50 border-dashed border-blue-200 rounded-md border-2 overflow-hidden shadow-sm cursor-pointer ${className}`}
      >
        <PlusCircle className={`h-${iconSize/2} w-${iconSize/2} ${iconColor}`} />
        <span className="font-medium text-sm text-blue-600">{label}</span>
      </button>
    )
  }
  
  // Style normal (par défaut) - similaire au bouton d'ajout d'étape existant
  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col transition-all duration-150 bg-white hover:bg-blue-50 border-dashed border-blue-200 rounded-md border-2 overflow-hidden shadow-sm cursor-pointer h-full ${className}`}
    >
      <div className="flex items-center justify-center p-2.5 h-full">
        <div className="flex flex-col items-center justify-center text-center">
          <PlusCircle className={`h-${iconSize} w-${iconSize} ${iconColor} mb-2`} />
          <h3 className="font-medium text-sm text-blue-600">{label}</h3>
        </div>
      </div>
    </div>
  )
} 