"use client"

import type React from "react"

import { useState } from "react"
import { FileUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface FileUploadProps {
  onUploadComplete?: (files: File[]) => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList)
    setFiles([...files, ...newFiles])
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const uploadFiles = () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          if (onUploadComplete) onUploadComplete(files)
          return 100
        }
        return prev + 5
      })
    }, 100)
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <FileUp className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium mb-1">Glissez-déposez vos fichiers ici</p>
          <p className="text-xs text-muted-foreground mb-4">ou</p>
          <Button variant="outline" size="sm" className="relative" disabled={uploading}>
            Parcourir les fichiers
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              disabled={uploading}
            />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, PDF jusqu'à 10MB</p>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fichiers sélectionnés</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-muted flex items-center justify-center rounded">
                    <span className="text-xs">{file.name.split(".").pop()}</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">Uploading... {progress}%</p>
            </div>
          ) : (
            <Button onClick={uploadFiles} className="w-full">
              Envoyer {files.length} fichier{files.length > 1 ? "s" : ""}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
