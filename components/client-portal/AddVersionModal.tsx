"use client"

import { FormEvent, useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"
import { uploadFile, validateFile } from "@/lib/upload"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debug log when modal open state changes
  useEffect(() => {
    console.log("🔴 AddVersionModal isOpen changed to:", isOpen);
    
    // Réinitialiser l'état du formulaire à chaque ouverture
    if (isOpen) {
      // DEBUG: Afficher le stepId stocké
      try {
        const stepId = localStorage.getItem('addingVersionForStepId');
        const sessionStepId = sessionStorage.getItem('lastSelectedStepId');
        console.log("🔍 AddVersionModal - Step IDs actuels:");
        console.log("  - localStorage:", stepId);
        console.log("  - sessionStorage:", sessionStepId);
      } catch (e) {
        console.error("Erreur lors de la lecture depuis storage:", e);
      }
      
      setSelectedFile(null);
      setIsSubmitting(false);
      
      // Réinitialiser le champ de fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // CORRECTION CRITIQUE: Forcer l'affichage du modal via DOM avec plusieurs approches
      console.log("⚠️ Tentative d'affichage du modal...");
      
      // Approche 1: via la référence React
      if (modalRef.current) {
        modalRef.current.style.display = 'flex';
        console.log("✅ Modal affiché via ref React");
      } else {
        console.log("❌ modalRef.current est null");
      }
      
      // Approche 2: via getElementById (avec délai)
      setTimeout(() => {
        // Vérifier que le modal existe dans le DOM
        const modalExists = !!document.getElementById('version-modal-container');
        console.log("Modal existe dans le DOM:", modalExists ? "OUI" : "NON");
        
        // Forcer l'affichage via DOM
        const modalElement = document.getElementById('version-modal-container');
        if (modalElement) {
          modalElement.style.display = 'flex';
          console.log("✅ Modal affiché via getElementById");
          
          // S'assurer que le body a le bon style
          document.body.style.overflow = 'hidden';
        } else {
          console.log("❌ getElementById('version-modal-container') est null");
        }
      }, 100);
      
      // Ajouter un gestionnaire pour la touche Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          console.log("Touche Escape détectée");
          // Fermer le modal
          onClose();
          
          // Manipuler directement le DOM pour garantir la fermeture
          setTimeout(() => {
            const modalElement = document.getElementById('version-modal-container');
            if (modalElement) {
              modalElement.style.display = 'none';
              console.log("Modal fermé via Escape");
            }
            document.body.style.overflow = 'auto';
          }, 50);
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      // Nettoyer l'événement lorsque le composant est démonté ou le modal fermé
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      // Cacher le modal sans le retirer du DOM
      if (modalRef.current) {
        modalRef.current.style.display = 'none';
        console.log("Modal caché via useEffect");
      }
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Récupérer les données du formulaire
    const formElement = event.target as HTMLFormElement
    const formData = new FormData(formElement)
    
    const versionName = formData.get('versionName') as string
    const versionDescription = formData.get('versionDescription') as string
    
    if (!versionName || !selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires et sélectionner un fichier.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      console.log("Début de la soumission avec fichier:", selectedFile.name);
      
      // DEBUG: Vérifier une dernière fois le stepId avant soumission
      try {
        const stepId = localStorage.getItem('addingVersionForStepId');
        console.log("🔴 VERIFICATION CRUCIALE - Step ID avant soumission (localStorage):", stepId);
      } catch (e) {
        console.error("Erreur lors de la lecture depuis localStorage:", e);
      }
      
      // Télécharger le fichier au moment de la soumission
      toast({
        title: "Téléchargement en cours",
        description: "Veuillez patienter pendant le téléchargement du fichier..."
      })
      
      // Valider le fichier d'abord
      const validation = validateFile(selectedFile, [], 20); // 20 MB max
      if (!validation.valid) {
        throw new Error(validation.error || "Fichier invalide");
      }
      
      // Télécharger le fichier vers le serveur
      const fileUrl = await uploadFile(selectedFile, "project-versions");
      console.log("Fichier téléchargé avec succès:", fileUrl);
      
      // Log détaillé des informations du fichier
      console.log("Informations du fichier:", {
        nom: selectedFile.name,
        taille: selectedFile.size,
        type: selectedFile.type,
        url: fileUrl
      });
      
      // Envoyer les données au composant parent
      await onSubmit({
        versionName,
        versionDescription,
        file: selectedFile
      })
      
      // Réinitialiser le formulaire
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log("Soumission réussie, fermeture du modal");
      
      // Approche double pour fermer le modal
      // 1. Appeler la fonction de fermeture React
      onClose()
      
      // 2. Manipuler directement le DOM pour garantir la fermeture
      setTimeout(() => {
        const modalElement = document.getElementById('version-modal-container');
        if (modalElement) {
          modalElement.style.display = 'none';
          console.log("Modal fermé via DOM après soumission");
        }
        document.body.style.overflow = 'auto';
      }, 50);
      
    } catch (error) {
      console.error("Error adding new version:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'ajout de la nouvelle version.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction pour sélectionner un fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Récupérer le premier fichier
    const file = files[0];
    
    // Validation légère côté client - sera validée à nouveau lors de la soumission
    if (file.size > 20 * 1024 * 1024) { // 20 MB
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 20 MB",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
  }
  
  // Fonction pour effacer le fichier sélectionné
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Fonction pour gérer les clics sur l'arrière-plan
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // S'assurer que le clic est bien sur l'arrière-plan et pas sur le contenu du modal
    if (e.target === e.currentTarget) {
      console.log("Clic sur l'arrière-plan détecté");
      
      // Approche double pour fermer le modal
      // 1. Appeler la fonction de fermeture React
      onClose();
      
      // 2. Manipuler directement le DOM pour garantir la fermeture
      setTimeout(() => {
        const modalElement = document.getElementById('version-modal-container');
        if (modalElement) {
          modalElement.style.display = 'none';
          console.log("Modal fermé via clic arrière-plan");
        }
        document.body.style.overflow = 'auto';
      }, 50);
    }
  };

  return (
    <div 
      ref={modalRef}
      id="version-modal-container" 
      className="fixed inset-0 z-[9999] bg-black/50 items-center justify-center"
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle version</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="versionName" className="block text-sm font-medium mb-1">Nom de la version*</label>
            <input 
              type="text" 
              id="versionName" 
              name="versionName" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ex: Version 2"
              required
            />
          </div>
          
          <div>
            <label htmlFor="versionDescription" className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              id="versionDescription" 
              name="versionDescription"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Décrivez les modifications dans cette version..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Fichier*</label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={clearSelectedFile}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Supprimer</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Sélectionner un fichier
              </Button>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {selectedFile 
                ? "Fichier sélectionné et prêt à être téléchargé. Cliquez sur \"Ajouter la version\" pour terminer."
                : "Tous types de fichiers acceptés. Taille maximale: 20 MB."}
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                console.log("Bouton Annuler cliqué");
                
                // Approche double: appeler la fonction React et manipuler directement le DOM
                // 1. Appeler la fonction de fermeture React
                onClose();
                
                // 2. Manipuler directement le DOM pour garantir la fermeture
                setTimeout(() => {
                  const modalElement = document.getElementById('version-modal-container');
                  if (modalElement) {
                    modalElement.style.display = 'none';
                    console.log("Modal fermé via DOM depuis bouton Annuler");
                  }
                  document.body.style.overflow = 'auto';
                }, 50);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Téléchargement...</span>
                </span>
              ) : (
                "Ajouter la version"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 