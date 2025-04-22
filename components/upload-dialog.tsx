"use client"

import type React from "react"

import { useState } from "react"
import { FileUp } from "lucide-react"

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
import { FileUpload } from "./file-upload"

export function UploadDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const handleUploadComplete = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the files and metadata to your server
    console.log("Submitting:", { title, description, files })
    setOpen(false)
    // Reset form
    setTitle("")
    setDescription("")
    setFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileUp className="h-4 w-4" />
          Envoyer des fichiers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
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
              <Label>Fichiers</Label>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!title || files.length === 0}>
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
