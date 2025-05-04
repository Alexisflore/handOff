"use client"

import { useState, useRef } from 'react'
import { Button } from './button'
import { useToast } from './use-toast'
import { Upload, X } from 'lucide-react'
import { uploadFile, validateFile } from '@/lib/upload'

interface FileUploaderProps {
  onUploadComplete: (url: string, file: File) => void
  folder?: string
  maxSizeInMB?: number
  allowedTypes?: string[]
  buttonText?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
}

export function FileUploader({
  onUploadComplete,
  folder = 'uploads',
  maxSizeInMB = 20,
  allowedTypes = [],
  buttonText = 'Sélectionner un fichier',
  variant = 'default'
}: FileUploaderProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Valider le fichier
    const validation = validateFile(file, allowedTypes, maxSizeInMB)
    if (!validation.valid) {
      toast({
        title: 'Fichier non valide',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }
    
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    try {
      // Upload du fichier
      const url = await uploadFile(selectedFile, folder)
      
      // Callback avec l'URL
      onUploadComplete(url, selectedFile)
      
      // Réinitialiser
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      toast({
        title: 'Téléchargement réussi',
        description: 'Le fichier a été téléchargé avec succès.'
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast({
        title: 'Erreur',
        description: 'Le téléchargement a échoué. Veuillez réessayer.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
      />
      
      {selectedFile ? (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button 
              onClick={clearSelectedFile}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Supprimer le fichier"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Téléchargement...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Télécharger maintenant</span>
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelectedFile}
              disabled={isUploading}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          type="button" 
          onClick={triggerFileInput}
          variant={variant}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      )}
    </div>
  )
} 