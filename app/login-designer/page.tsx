"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function LoginDesignerPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const router = useRouter()
  
  const designerId = process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001"

  async function handleLogin() {
    try {
      setLoading(true)
      setError(null)
      
      // Appeler une API de connexion
      const response = await fetch("/api/auth/designer-login", {
        method: "POST",
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error("Erreur de connexion:", data)
        setError(data.error || `Erreur ${response.status}: ${response.statusText}`)
        return
      }
      
      setSuccess(true)
      setSessionInfo(data)
      
      // Rediriger vers la page du projet Brand Redesign
      router.push("/projects/550e8400-e29b-41d4-a716-446655440020")
    } catch (err) {
      console.error("Erreur:", err)
      setError(`Une erreur s'est produite: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-[400px] shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Connexion Designer</CardTitle>
          <CardDescription>
            Connectez-vous en tant que Designer pour accéder au projet Brand Redesign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Vous allez vous connecter avec l'ID :
            </p>
            <code className="bg-slate-100 p-2 rounded-md text-xs block overflow-auto">
              {designerId}
            </code>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && sessionInfo && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-sm">
              <p className="font-semibold">Connexion réussie !</p>
              <p className="text-xs mt-1">Session ID: {sessionInfo.sessionId}</p>
              <p className="text-xs">Redirection en cours...</p>
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={loading || success}
          >
            {loading ? "Connexion en cours..." : "Se connecter en tant que Designer"}
          </Button>
          
          {success && (
            <Button 
              className="w-full mt-2" 
              variant="outline"
              onClick={() => router.push("/projects/550e8400-e29b-41d4-a716-446655440020")}
            >
              Accéder au projet Brand Redesign
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 