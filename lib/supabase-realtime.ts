"use client"

import { createClientSupabaseClient } from "@/lib/supabase"
import { useEffect, useState } from "react"

/**
 * Hook pour s'abonner aux changements de la base de données en temps réel
 */
export function useRealtimeSubscription<T>(
  table: string,
  column: string,
  value: string,
  callback: (payload: { new: T; old: T }) => void,
  enabled = true,
) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClientSupabaseClient()
    let subscription: any = null

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`${table}-${value}-changes`)
          .on(
            "postgres_changes",
            {
              event: "*", // Écouter tous les événements (INSERT, UPDATE, DELETE)
              schema: "public",
              table,
              filter: `${column}=eq.${value}`,
            },
            (payload) => {
              callback(payload as any)
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsSubscribed(true)
            }
          })
      } catch (err) {
        setError(err as Error)
        console.error("Error setting up realtime subscription:", err)
      }
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, column, value, callback, enabled])

  return { isSubscribed, error }
}

/**
 * Hook pour s'abonner aux changements des commentaires d'un projet
 */
export function useProjectCommentsSubscription(
  projectId: string,
  onNewComment: (comment: any) => void,
  enabled = true,
) {
  return useRealtimeSubscription(
    "comments",
    "project_id",
    projectId,
    (payload) => {
      if (payload.new && payload.new.id) {
        onNewComment(payload.new)
      }
    },
    enabled,
  )
}

/**
 * Hook pour s'abonner aux changements des fichiers partagés d'un projet
 */
export function useProjectFilesSubscription(
  projectId: string,
  onFileChange: (file: any, eventType: "INSERT" | "UPDATE" | "DELETE") => void,
  enabled = true,
) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClientSupabaseClient()
    let subscription: any = null

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`shared_files-${projectId}-changes`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "shared_files",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              onFileChange(payload.new, "INSERT")
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "shared_files",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              onFileChange(payload.new, "UPDATE")
            },
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "shared_files",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              onFileChange(payload.old, "DELETE")
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsSubscribed(true)
            }
          })
      } catch (err) {
        setError(err as Error)
        console.error("Error setting up realtime subscription:", err)
      }
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [projectId, onFileChange, enabled])

  return { isSubscribed, error }
}

/**
 * Hook pour s'abonner aux changements des livrables d'un projet
 */
export function useDeliverablesSubscription(
  projectId: string,
  onDeliverableChange: (deliverable: any, eventType: "INSERT" | "UPDATE" | "DELETE") => void,
  enabled = true,
) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClientSupabaseClient()
    let subscription: any = null

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`deliverables-${projectId}-changes`)
          .on(
            "postgres_changes",
            {
              event: "*", // Écouter tous les événements
              schema: "public",
              table: "deliverables",
              filter: `project_id=eq.${projectId}`,
            },
            (payload: any) => {
              onDeliverableChange(payload.new || payload.old, payload.eventType)
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsSubscribed(true)
            }
          })
      } catch (err) {
        setError(err as Error)
        console.error("Error setting up realtime subscription:", err)
      }
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [projectId, onDeliverableChange, enabled])

  return { isSubscribed, error }
}
