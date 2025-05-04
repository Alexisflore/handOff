"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface DropdownIndicatorProps {
  isOpen?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function DropdownIndicator({ 
  isOpen = false, 
  className, 
  size = "md" 
}: DropdownIndicatorProps) {
  const sizes = {
    sm: {
      container: "w-3 h-3",
      horizontal: "w-2.5 h-0.5",
      vertical: "w-0.5 h-2.5"
    },
    md: {
      container: "w-4 h-4", 
      horizontal: "w-3.5 h-0.5",
      vertical: "w-0.5 h-3.5"
    },
    lg: {
      container: "w-5 h-5",
      horizontal: "w-4.5 h-0.5",
      vertical: "w-0.5 h-4.5"
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity",
      sizes[size].container,
      className
    )}>
      <div className={cn(
        "bg-slate-400 group-hover:bg-slate-600 rounded-full relative group-hover:transform group-hover:translate-y-[1px] transition-all",
        sizes[size].horizontal
      )}>
        {!isOpen && (
          <div className={cn(
            "absolute bg-slate-400 group-hover:bg-slate-600 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:h-0 transition-all duration-200",
            sizes[size].vertical
          )}></div>
        )}
      </div>
    </div>
  )
} 