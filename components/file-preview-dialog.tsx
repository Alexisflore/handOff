"use client"

import type React from "react"

import { useState } from "react"
import { Download, Eye, FileText, ImageIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FilePreview } from "@/components/file-preview"

interface FilePreviewDialogProps {
  file: {
    id: string
    title: string
    description: string
    file_name: string
    file_type: string
    file_url: string
    preview_url?: string
    created_at: string
    is_client: boolean
  }
  trigger?: React.ReactNode
}

export function FilePreviewDialog({ file, trigger }: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false)

  const getFileIcon = () => {
    switch (file.file_type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getFileTypeLabel = () => {
    switch (file.file_type) {
      case "pdf":
        return "PDF Document"
      case "docx":
        return "Word Document"
      case "jpg":
      case "jpeg":
        return "JPEG Image"
      case "png":
        return "PNG Image"
      default:
        return file.file_type.toUpperCase()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 text-xs w-full">
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getFileIcon()}
            <DialogTitle>{file.title}</DialogTitle>
          </div>
          <DialogDescription>
            {file.description || "No description provided"} • {getFileTypeLabel()} • Uploaded on{" "}
            {formatDate(file.created_at)} • By {file.is_client ? "You" : "Designer"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-muted">
          <FilePreview
            fileType={file.file_type}
            fileName={file.file_name}
            fileUrl={file.file_url || "/placeholder.svg"}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
