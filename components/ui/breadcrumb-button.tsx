"use client"

import React, { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DropdownIndicator } from "@/components/ui/dropdown-indicator"

interface BreadcrumbButtonProps {
  className?: string
  label: string
  badge?: {
    text: string
    variant?: "default" | "outline" | "secondary" | "destructive"
    status?: "default" | "in_progress" | "completed" | "current" | "pending"
  }
  icon?: ReactNode
  showDropdownIndicator?: boolean
  isDropdownOpen?: boolean
  onClick?: () => void
}

export function BreadcrumbButton({
  className,
  label,
  badge,
  icon,
  showDropdownIndicator = false,
  isDropdownOpen = false,
  onClick
}: BreadcrumbButtonProps) {
  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'current':
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className={cn(
        "h-10 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group",
        className
      )}
    >
      {icon && <div className="mr-1">{icon}</div>}
      <span className="font-medium truncate">{label}</span>
      
      {badge && (
        <Badge 
          variant={badge.variant || "outline"} 
          className={cn(
            "ml-1 border text-xs px-2 py-0.5 transition-all group-hover:shadow-sm",
            badge.status && getStatusStyles(badge.status)
          )}
        >
          {badge.text}
        </Badge>
      )}
      
      {showDropdownIndicator && (
        <DropdownIndicator isOpen={isDropdownOpen} />
      )}
    </Button>
  )
} 