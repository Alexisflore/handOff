import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

// Charge les variables d'environnement
dotenv.config({ path: ".env.local" })

// Création du client Supabase
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}

async function seedUsers() {
  try {
    console.log("🔑 Création des utilisateurs...")
    const supabase = createServerSupabaseClient()
    
    // Récupération des IDs depuis les variables d'environnement
    const designerId = process.env.DESIGNER_ID
    const clientId = process.env.CLIENT_ID
    
    // 1. Créer l'utilisateur Designer
    const { data: designerData, error: designerError } = await supabase.auth.admin.createUser({
      email: "designer@example.com",
      password: "designerpass123",
      email_confirm: true,
      user_metadata: {
        role: "designer",
        custom_id: designerId
      }
    })
    
    if (designerError) {
      // Si l'utilisateur existe déjà, on le met à jour
      if (designerError.message.includes("already exists")) {
        console.log("⚠️ Le designer existe déjà, mise à jour...")
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          designerId as string,
          { password: "designerpass123" }
        )
        if (updateError) console.error("❌ Erreur mise à jour designer:", updateError)
        else console.log("✅ Designer mis à jour avec succès!")
      } else {
        console.error("❌ Erreur création designer:", designerError)
      }
    } else {
      console.log("✅ Designer créé avec succès:", designerData.user.id)
    }
    
    // 2. Créer l'utilisateur Client
    const { data: clientData, error: clientError } = await supabase.auth.admin.createUser({
      email: "client@example.com",
      password: "clientpass123",
      email_confirm: true,
      user_metadata: {
        role: "client",
        custom_id: clientId
      }
    })
    
    if (clientError) {
      // Si l'utilisateur existe déjà, on le met à jour
      if (clientError.message.includes("already exists")) {
        console.log("⚠️ Le client existe déjà, mise à jour...")
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          clientId as string,
          { password: "clientpass123" }
        )
        if (updateError) console.error("❌ Erreur mise à jour client:", updateError)
        else console.log("✅ Client mis à jour avec succès!")
      } else {
        console.error("❌ Erreur création client:", clientError)
      }
    } else {
      console.log("✅ Client créé avec succès:", clientData.user.id)
    }
    
    console.log("✅ Seed terminé avec succès!")
  } catch (error) {
    console.error("❌ Erreur générale:", error)
  }
}

// Exécution du script
seedUsers().then(() => process.exit(0)) 