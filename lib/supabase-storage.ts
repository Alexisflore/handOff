"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

/**
 * Télécharge un fichier vers Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  bucket = "shared-files",
  folder = "client-uploads",
): Promise<{ path: string; url: string }> {
  const supabase = createServerSupabaseClient()

  try {
    // Générer un nom de fichier unique pour éviter les collisions
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    // Télécharger le fichier vers Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error("Error uploading file to Supabase Storage:", error)
    throw error
  }
}

/**
 * Supprime un fichier de Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string, bucket = "shared-files"): Promise<{ success: boolean }> {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting file from Supabase Storage:", error)
    throw error
  }
}

/**
 * Génère une URL signée pour un fichier privé
 */
export async function getSignedUrl(
  filePath: string,
  bucket = "shared-files",
  expiresIn = 60, // 60 secondes par défaut
): Promise<{ signedUrl: string }> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn)

    if (error) throw error

    return { signedUrl: data.signedUrl }
  } catch (error) {
    console.error("Error generating signed URL:", error)
    throw error
  }
}

/**
 * Crée un bucket s'il n'existe pas déjà
 */
export async function createBucketIfNotExists(bucket = "shared-files"): Promise<{ success: boolean }> {
  const supabase = createServerSupabaseClient()

  try {
    // Vérifier si le bucket existe déjà
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === bucket)

    if (!bucketExists) {
      // Créer le bucket s'il n'existe pas
      const { error } = await supabase.storage.createBucket(bucket, {
        public: false, // Définir sur true pour rendre tous les fichiers publics par défaut
      })

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating bucket:", error)
    throw error
  }
}

/**
 * Obtient une liste de fichiers dans un dossier
 */
export async function listFiles(folder = "", bucket = "shared-files"): Promise<{ files: any[]; error: any }> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder)

    if (error) throw error

    return { files: data || [], error: null }
  } catch (error) {
    console.error("Error listing files:", error)
    return { files: [], error }
  }
}
