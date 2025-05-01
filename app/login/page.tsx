"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"client" | "designer">("client")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/"
  
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push(redirectPath)
      }
    }
    
    checkSession()
  }, [router, redirectPath, supabase.auth])

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      
      // Connexion normale avec email/mot de passe
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      // Rediriger vers la page demandée ou la page d'accueil
      router.push(redirectPath)
    } catch (err) {
      console.error("Erreur lors de la connexion:", err)
      setError(`Une erreur s'est produite: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleDesignerLogin() {
    try {
      setLoading(true)
      setError(null)
      
      // ID fixe du designer
      const designerId = "550e8400-e29b-41d4-a716-446655440001";
      
      console.log("🚀 Tentative de connexion designer avec ID:", designerId);
      
      const response = await fetch("/api/auth/designer-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          designerId: designerId
        })
      })
      
      console.log("📬 Réponse reçue:", response.status)
      
      const data = await response.json()
      console.log("📋 Données:", data)
      
      if (!response.ok) {
        setError(data.error || `Erreur ${response.status}: ${response.statusText}`)
        return
      }
      
      // Au lieu d'utiliser router.push ou window.location.href, créer un élément <form> et le soumettre
      // Cette approche garantit une actualisation complète avec les cookies
      console.log("✅ Connexion réussie, redirection forcée vers:", redirectPath)
      
      // Créer un formulaire temporaire pour forcer l'actualisation de la page
      const form = document.createElement('form')
      form.method = 'GET'
      form.action = redirectPath
      
      // Soumettre le formulaire
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error("❌ Erreur lors de la connexion designer:", error)
      setError(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-[400px] shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="client" value={mode} onValueChange={(value) => setMode(value as "client" | "designer")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="designer">Designer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="client" className="space-y-4">
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit"
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="designer" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vous allez vous connecter en tant que designer avec les identifiants par défaut.
                </p>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleDesignerLogin}
                  disabled={loading}
                >
                  {loading ? "Connexion en cours..." : "Se connecter en tant que Designer"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 