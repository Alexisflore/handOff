import React, { ReactNode } from "react"
import { Clock, CheckCircle2, AlertTriangle, CalendarClock, FileText, ImageIcon } from "lucide-react"

// Define DeadlineStatus interface here directly
interface DeadlineStatus {
  label: string
  icon: React.ReactNode
  style: string
}

/**
 * Custom hook for project files operations
 */
export function useProjectFiles() {
  /**
   * Returns an icon based on file type
   */
  const getFileIcon = (fileType: string): ReactNode => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "jpg":
      case "png":
        return <ImageIcon className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  /**
   * Returns styling and icon information for file status
   */
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null
    
    let badgeStyle = "bg-slate-100 text-slate-700 hover:bg-slate-100"
    let icon: React.ReactNode = null
    
    if (status === "Approved") {
      badgeStyle = "bg-green-50 text-green-700 hover:bg-green-50"
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />
    } else if (status === "In Progress") {
      badgeStyle = "bg-blue-50 text-blue-700 hover:bg-blue-50"
      icon = <Clock className="h-3 w-3 mr-1" />
    } else if (status === "Pending Review") {
      badgeStyle = "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
      icon = <Clock className="h-3 w-3 mr-1" />
    }
    
    return {
      style: badgeStyle,
      icon
    }
  }

  /**
   * Returns deadline status information with appropriate styling and icon
   */
  const getDeadlineStatus = (dueDate: string | undefined): DeadlineStatus | null => {
    if (!dueDate) return null
    
    const now = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return {
        label: "Overdue",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
        style: "bg-red-50 text-red-700 hover:bg-red-50",
      }
    } else if (diffDays <= 2) {
      return {
        label: `Due soon (${diffDays} day${diffDays === 1 ? '' : 's'})`,
        icon: <Clock className="h-3 w-3 mr-1" />,
        style: "bg-orange-50 text-orange-700 hover:bg-orange-50",
      }
    } else {
      return {
        label: `Due in ${diffDays} days`,
        icon: <CalendarClock className="h-3 w-3 mr-1" />,
        style: "bg-blue-50 text-blue-700 hover:bg-blue-50",
      }
    }
  }

  /**
   * Returns a file preview element based on the file type
   */
  const getFilePreview = (file: any) => {
    if (file.preview_url) {
      return (
        <div className="relative h-32 w-full overflow-hidden rounded-t-md bg-muted">
          <img
            src={file.preview_url || "/placeholder.svg"}
            alt={file.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )
    }

    return (
      <div className="flex h-32 w-full items-center justify-center rounded-t-md bg-muted">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
          {file.file_type === "pdf" && <FileText className="h-8 w-8 text-red-500" />}
          {file.file_type === "docx" && <FileText className="h-8 w-8 text-blue-500" />}
          {(file.file_type === "jpg" || file.file_type === "png") && <ImageIcon className="h-8 w-8 text-purple-500" />}
          {!["pdf", "docx", "jpg", "png"].includes(file.file_type) && <FileText className="h-8 w-8 text-gray-500" />}
        </div>
      </div>
    )
  }

  return {
    getFileIcon,
    getStatusBadge,
    getDeadlineStatus,
    getFilePreview
  }
} 