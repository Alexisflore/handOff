"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X } from "lucide-react"
import { useProjectCommentsSubscription, useProjectFilesSubscription } from "@/lib/supabase-realtime"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@supabase/ssr"

interface Notification {
  id: string
  type: "comment" | "file" | "deliverable" | "system"
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

interface RealtimeNotificationsProps {
  projectId: string
  userId: string
}

export function RealtimeNotifications({ projectId, userId }: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [userCache, setUserCache] = useState<Record<string, any>>({})

  // Fonction pour récupérer les informations d'un utilisateur
  const getUserInfo = async (userId: string, isClient: boolean) => {
    // Si l'utilisateur est déjà dans le cache, le renvoyer
    if (userCache[userId]) {
      return userCache[userId]
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single()
      
      if (error || !data) {
        return isClient ? "Le client" : "Le designer"
      }
      
      // Mettre à jour le cache
      setUserCache(prev => ({
        ...prev,
        [userId]: data.full_name
      }))
      
      return data.full_name
    } catch (error) {
      console.error("Erreur lors de la récupération des informations utilisateur:", error)
      return isClient ? "Le client" : "Le designer"
    }
  }

  // S'abonner aux nouveaux commentaires
  useProjectCommentsSubscription(
    projectId,
    async (comment) => {
      // Ne pas notifier l'utilisateur de ses propres commentaires
      if (comment.user_id === userId) return

      // Récupérer le nom d'utilisateur
      const userName = await getUserInfo(comment.user_id, comment.is_client)

      const newNotification: Notification = {
        id: `comment-${comment.id}`,
        type: "comment",
        title: "Nouveau commentaire",
        message: `${userName} a ajouté un commentaire: "${comment.content.substring(0, 50)}${
          comment.content.length > 50 ? "..." : ""
        }"`,
        timestamp: new Date(),
        read: false,
        data: comment,
      }

      addNotification(newNotification)
    },
    true,
  )

  // S'abonner aux changements de fichiers
  useProjectFilesSubscription(
    projectId,
    async (file, eventType) => {
      // Ne pas notifier l'utilisateur de ses propres actions
      if (file.uploaded_by === userId) return

      // Récupérer le nom d'utilisateur
      const userName = await getUserInfo(file.uploaded_by, file.is_client)

      let newNotification: Notification | null = null

      if (eventType === "INSERT") {
        newNotification = {
          id: `file-${file.id}`,
          type: "file",
          title: "Nouveau fichier",
          message: `${userName} a partagé un nouveau fichier: "${file.title}"`,
          timestamp: new Date(),
          read: false,
          data: file,
        }
      } else if (eventType === "UPDATE") {
        newNotification = {
          id: `file-update-${file.id}`,
          type: "file",
          title: "Fichier mis à jour",
          message: `${userName} a mis à jour le fichier: "${file.title}"`,
          timestamp: new Date(),
          read: false,
          data: file,
        }
      }

      if (newNotification) {
        addNotification(newNotification)
      }
    },
    true,
  )

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      // Vérifier si la notification existe déjà
      const exists = prev.some((n) => n.id === notification.id)
      if (exists) return prev

      // Ajouter la nouvelle notification au début du tableau
      return [notification, ...prev]
    })
  }

  // Mettre à jour le compteur de notifications non lues
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    )
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}j`
    } else if (hours > 0) {
      return `${hours}h`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return "à l'instant"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs font-bold text-white"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs text-muted-foreground">Les nouvelles notifications apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn("flex items-start gap-2 p-3 hover:bg-muted/50", !notification.read && "bg-muted/30")}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(notification.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
