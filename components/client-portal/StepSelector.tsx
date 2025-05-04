"use client"

import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Deliverable } from "./types"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AddButton } from "@/components/ui/add-button"

// Interface pour représenter une étape de projet
interface ProjectStep {
  id: string
  title: string
  description?: string
  status: string
  project_id: string
}

// Renommer l'interface pour refléter que nous affichons des "steps" maintenant
interface StepSelectorProps {
  projectSteps: ProjectStep[] | any[] // Liste des étapes du projet (project_steps)
  activeStepId: string // L'ID de l'étape actuellement sélectionnée
  onStepSelect: (stepId: string, showLatest?: boolean) => void // Fonction appelée lors de la sélection d'une étape
  closeSelector: () => void
  project: any
  isOpen: boolean
  onAddStep?: () => void
  isDesigner?: boolean // Ajout du prop isDesigner
}

// Renommer le composant pour refléter son nouveau rôle
export function StepSelector({
  projectSteps,
  activeStepId,
  onStepSelect,
  closeSelector,
  project,
  isOpen,
  onAddStep,
  isDesigner = false // Valeur par défaut à false
}: StepSelectorProps) {
  const { toast } = useToast()
  
  // Gestion du clic sur une étape
  function handleClick(id: string, title: string, status: string, event: React.MouseEvent) {
    // Prevent default behavior
    event.preventDefault();
    
    // Vérifier si l'utilisateur peut accéder à cette étape
    const statusLower = status?.toLowerCase() || '';
    const isUpcoming = statusLower === "upcoming" || statusLower === "pending";
    
    // Designer peut cliquer sur les étapes à venir, les autres utilisateurs non
    if (isUpcoming && !isDesigner) {
      toast({
        title: "Accès restreint",
        description: "Seuls les designers peuvent accéder aux étapes à venir.",
        variant: "destructive"
      });
      return;
    }
    
    // Appeler la fonction de sélection avec l'ID et indiquer qu'on veut la dernière version
    onStepSelect(id, true)
    
    // Notification
    toast({
      title: "Étape sélectionnée",
      description: "Navigation vers " + title
    })
  }

  // Fonction pour gérer le clic sur le bouton d'ajout d'étape
  function handleAddStep(e: React.MouseEvent) {
    e.preventDefault();
    if (onAddStep) {
      onAddStep();
    } else {
      toast({
        title: "Fonction non disponible",
        description: "La fonction d'ajout d'étape n'est pas encore implémentée."
      });
    }
  }

  // Fonction pour mapper le statut de l'étape à un style visuel
  function getStatusStyle(status: string) {
    // Mapper les valeurs possibles du statut aux styles
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('complet') || statusLower === 'approved') {
      return { 
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        indicator: "bg-emerald-400",
        label: "Terminée"
      };
    } else if (statusLower.includes('progress') || statusLower === 'current' || statusLower === 'in progress') {
      return { 
        badge: "bg-violet-50 text-violet-700 border-violet-100",
        indicator: "bg-violet-400",
        label: "En cours"
      };
    } else {
      return { 
        badge: "bg-gray-50 text-gray-600 border-gray-100",
        indicator: "bg-transparent",
        label: "À venir"
      };
    }
  }

  return (
    <div id="step-selector" className={isOpen ? "" : "hidden"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-1 px-3">
        {projectSteps.map((step) => {
          const status = getStatusStyle(step.status || 'Pending');
          const statusLower = (step.status || '').toLowerCase();
          const isUpcoming = statusLower === "upcoming" || statusLower === "pending";
          
          return (
            <div 
              key={step.id}
              onClick={(e) => handleClick(step.id, step.title, step.status, e)}
              className={`
                group flex flex-col transition-all duration-150
                ${step.id === activeStepId ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'}
                ${isUpcoming && !isDesigner ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                rounded-md border overflow-hidden shadow-sm
              `}
            >
              <div className="flex items-start p-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-medium text-sm truncate text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-0.5">
                    {step.description || "Aucune description disponible"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`
                    text-xs shrink-0 ml-2
                    ${status.badge}
                  `}
                >
                  {status.label}
                </Badge>
              </div>
              <div 
                className={`h-1 w-full mt-auto ${status.indicator}`}
              />
            </div>
          );
        })}
        
        {/* Add Step Button */}
        {onAddStep && (
          <AddButton
            label="Ajouter une étape"
            onClick={handleAddStep}
          />
        )}
      </div>
    </div>
  )
} 