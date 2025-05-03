"use client"

import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Deliverable } from "./types"

interface DeliverableSelectorProps {
  deliverables: Deliverable[]
  activeDeliverableId: string
  onDeliverableSelect: (deliverableId: string) => void
  closeSelector: () => void
  project: any
  isOpen: boolean
}

export function DeliverableSelector({
  deliverables,
  activeDeliverableId,
  onDeliverableSelect,
  closeSelector,
  project,
  isOpen
}: DeliverableSelectorProps) {
  const { toast } = useToast()
  
  // Gestion du clic sur un livrable
  function handleClick(id: string, title: string, status: string, event: React.MouseEvent) {
    // Prevent default behavior
    event.preventDefault();
    
    // Ne pas traiter les livrables à venir
    if (status === "upcoming") return
    
    // Appeler la fonction de sélection avec l'ID
    onDeliverableSelect(id)
    
    // Ne plus fermer le sélecteur
    // closeSelector()
    
    // Notification
    toast({
      title: "Livrable sélectionné",
      description: "Navigation vers " + title
    })
  }

  return (
    <div id="deliverable-selector" className={isOpen ? "" : "hidden"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-1 px-3">
        {deliverables.map((d) => (
          <div 
            key={d.id}
            onClick={(e) => handleClick(d.id, d.title, d.status, e)}
            className={`
              group flex flex-col transition-all duration-150
              ${d.id === activeDeliverableId ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'}
              ${d.status === "upcoming" ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
              rounded-md border overflow-hidden shadow-sm
            `}
          >
            <div className="flex items-start p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-medium text-sm truncate text-gray-800">{d.title}</h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-0.5">
                  {d.description || "No description available"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`
                  text-xs shrink-0 ml-2
                  ${d.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                    d.status === "current" ? "bg-violet-50 text-violet-700 border-violet-100" : 
                    "bg-gray-50 text-gray-600 border-gray-100"}
                `}
              >
                {d.status === "completed" ? "Approved" : 
                 d.status === "current" ? "In Progress" : 
                 "Upcoming"}
              </Badge>
            </div>
            <div 
              className={`h-1 w-full mt-auto ${
                d.status === "completed" ? "bg-emerald-400" : 
                d.status === "current" ? "bg-violet-400" : 
                "bg-transparent"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 