"use client"

import type React from "react"

import { useState } from "react"
import { FileUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { uploadSharedFile } from "@/services/project-service"
import { toast } from "@/components/ui/use-toast"

interface UploadFileDialogProps {
  projectId: string
  userId: string
  isClient: boolean
  clientId?: string
  onUploadComplete?: () => void
}

export function UploadFileDialog({ projectId, userId, isClient, clientId, onUploadComplete }: UploadFileDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
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

    // Vérifier la taille des fichiers (limite à 10 Mo)
    const validFiles = newFiles.filter((file) => {
      const isValid = file.size <= 10 * 1024 * 1024 // 10 Mo en octets
      if (!isValid) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier "${file.name}" dépasse la limite de 10 Mo.`,
          variant: "destructive",
        })
      }
      return isValid
    })

    setFiles([...files, ...validFiles])
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const uploadFiles = async () => {
    if (files.length === 0 || !title) return

    setUploading(true)
    setProgress(0)

    try {
      // Simuler la progression du téléchargement
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 5
        })
      }, 100)

      // Télécharger le fichier principal (pour l'instant, nous ne prenons que le premier fichier)
      const file = files[0]

      await uploadSharedFile(projectId, userId, isClient, clientId || null, {
        title,
        description,
        file,
      })

      // Simuler la fin du téléchargement
      setProgress(100)

      toast({
        title: "Fichier téléchargé",
        description: "Votre fichier a été téléchargé avec succès.",
      })

      setTimeout(() => {
        setUploading(false)
        setOpen(false)
        setTitle("")
        setDescription("")
        setFiles([])
        if (onUploadComplete) onUploadComplete()
      }, 500)
    } catch (error) {
      console.error("Error uploading file:", error)

      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur s'est produite lors du téléchargement du fichier. Veuillez réessayer.",
        variant: "destructive",
      })

      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileUp className="h-4 w-4" />
          <span>Envoyer des fichiers</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            uploadFiles()
          }}
        >
          <DialogHeader>
            <DialogTitle>Envoyer des fichiers</DialogTitle>
            <DialogDescription>
              Partagez des documents, images ou commentaires avec l'équipe du projet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Feedback sur le design"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez des détails ou instructions..."
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label>Fichier</Label>
              <div
                className={`border-2 border-dashed rounded-md ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-6 text-center">
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
                </div>
              </div>
            </div>

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

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">Uploading... {progress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Annuler
            </Button>
            <Button type="submit" disabled={!title || files.length === 0 || uploading}>
              {uploading ? "Téléchargement..." : `Envoyer ${files.length} fichier${files.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
