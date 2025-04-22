"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function SeedBrandRedesignButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/seed-brand-redesign")
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: data.message,
        })

        // Rediriger vers la page du projet créé
        if (data.projectId) {
          router.push(`/projects/${data.projectId}`)
        } else {
          // Rafraîchir la page pour afficher le nouveau projet
          router.refresh()
        }
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Une erreur est survenue lors de la création du projet",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du projet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSeed} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création en cours...
        </>
      ) : (
        "Créer le projet Brand Redesign"
      )}
    </Button>
  )
}
