"use client"

import { FormEvent, useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AddStepModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    stepName: string
    stepDescription: string
  }) => Promise<void>
}

export function AddStepModal({ isOpen, onClose, onSubmit }: AddStepModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Debug log when modal open state changes
  useEffect(() => {
    console.log("AddStepModal isOpen changed to:", isOpen);
    
    // Réinitialiser l'état du formulaire à chaque ouverture
    if (isOpen) {
      setIsSubmitting(false);
      
      // Forcer l'affichage du modal via le DOM
      if (modalRef.current) {
        modalRef.current.style.display = 'flex';
        console.log("Modal étape affiché via useEffect");
      }
      
      // Ajouter un gestionnaire pour la touche Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          console.log("Touche Escape détectée");
          // Fermer le modal
          onClose();
          
          // Manipuler directement le DOM pour garantir la fermeture
          setTimeout(() => {
            const modalElement = document.getElementById('step-modal-container');
            if (modalElement) {
              modalElement.style.display = 'none';
              console.log("Modal étape fermé via Escape");
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
        console.log("Modal étape caché via useEffect");
      }
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Récupérer les données du formulaire
    const formElement = event.target as HTMLFormElement
    const formData = new FormData(formElement)
    
    const stepName = formData.get('stepName') as string
    const stepDescription = formData.get('stepDescription') as string
    
    if (!stepName) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom à l'étape.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      console.log("Début de la soumission de l'étape:", stepName);
      
      // Envoyer les données au composant parent
      await onSubmit({
        stepName,
        stepDescription
      })
      
      console.log("Soumission de l'étape réussie, fermeture du modal");
      
      // Approche double pour fermer le modal
      // 1. Appeler la fonction de fermeture React
      onClose()
      
      // 2. Manipuler directement le DOM pour garantir la fermeture
      setTimeout(() => {
        const modalElement = document.getElementById('step-modal-container');
        if (modalElement) {
          modalElement.style.display = 'none';
          console.log("Modal étape fermé via DOM après soumission");
        }
        document.body.style.overflow = 'auto';
      }, 50);
      
    } catch (error) {
      console.error("Error adding new step:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'ajout de la nouvelle étape.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
        const modalElement = document.getElementById('step-modal-container');
        if (modalElement) {
          modalElement.style.display = 'none';
          console.log("Modal étape fermé via clic arrière-plan");
        }
        document.body.style.overflow = 'auto';
      }, 50);
    }
  };

  return (
    <div 
      ref={modalRef}
      id="step-modal-container" 
      className="fixed inset-0 z-[9999] bg-black/50 items-center justify-center"
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle étape</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="stepName" className="block text-sm font-medium mb-1">Nom de l'étape*</label>
            <input 
              type="text" 
              id="stepName" 
              name="stepName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ex: Maquettes, Développement, Validation..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="stepDescription" className="block text-sm font-medium mb-1">Description de l'étape</label>
            <textarea 
              id="stepDescription" 
              name="stepDescription"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Description détaillée de cette étape..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setTimeout(() => {
                  const modalElement = document.getElementById('step-modal-container');
                  if (modalElement) modalElement.style.display = 'none';
                  document.body.style.overflow = 'auto';
                }, 50);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter l'étape"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 