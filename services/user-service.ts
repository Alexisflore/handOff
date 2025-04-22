"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

// Récupère les informations d'un utilisateur par son ID
export async function getUserById(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Récupère le designer avec son ID
export async function getDesignerById(designerId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("freelancers")
      .select(`
        *,
        users (*)
      `)
      .eq("user_id", designerId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error getting designer by ID:", error)
    return null
  }
} 