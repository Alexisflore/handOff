"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface BreadcrumbSeparatorProps {
  className?: string
  size?: "sm" | "md" | "lg"
  color?: "default" | "muted" | "primary" | "secondary"
}

export function BreadcrumbSeparator({
  className,
  size = "md",
  color = "muted"
}: BreadcrumbSeparatorProps) {
  const sizes = {
    sm: "h-0.5 w-0.5",
    md: "h-1 w-1",
    lg: "h-1.5 w-1.5"
  }

  const colors = {
    default: "bg-slate-400",
    muted: "bg-slate-300",
    primary: "bg-blue-400",
    secondary: "bg-slate-400"
  }

  return (
    <div className={cn(
      "mx-3 rounded-full",
      sizes[size],
      colors[color],
      className
    )}></div>
  )
} 