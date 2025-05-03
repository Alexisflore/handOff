"use client"

import { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AddVersionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    versionName: string
    versionDescription: string
    file: File
  }) => Promise<void>
}

export function AddVersionModal({ isOpen, onClose, onSubmit }: AddVersionModalProps) {
  const { toast } = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Récupérer les données du formulaire
    const formElement = event.target as HTMLFormElement
    const formData = new FormData(formElement)
    
    const versionName = formData.get('versionName') as string
    const versionDescription = formData.get('versionDescription') as string
    const file = formData.get('file') as File
    
    if (!versionName || !file) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Envoyer les données au composant parent
      await onSubmit({
        versionName,
        versionDescription,
        file
      })
      
      // Fermer le modal si tout s'est bien passé
      onClose()
      
    } catch (error) {
      console.error("Error adding new version:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'ajout de la nouvelle version.",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add a new version</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="versionName" className="block text-sm font-medium mb-1">Version Name*</label>
            <input 
              type="text" 
              id="versionName" 
              name="versionName" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. Version 2"
              required
            />
          </div>
          
          <div>
            <label htmlFor="versionDescription" className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              id="versionDescription" 
              name="versionDescription"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the changes in this version..."
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-1">Upload File*</label>
            <input 
              type="file" 
              id="file" 
              name="file"
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Version
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 