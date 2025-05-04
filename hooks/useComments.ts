import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { addComment } from "@/services/project-service";
import { Comment } from "../components/client-portal/types";

export function useComments(initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const { toast } = useToast();

  const handleSendComment = async (
    activeVersionId: string,
    userId: string,
    content: string,
    isClient: boolean,
    client: any,
    freelancer: any,
    currentUser: any
  ) => {
    if (!activeVersionId) return;

    try {
      // Déterminer le bon ID utilisateur
      const userIdToUse = userId || process.env.NEXT_PUBLIC_DESIGNER_ID || "550e8400-e29b-41d4-a716-446655440001";
      
      // ID client à passer uniquement si c'est un client
      const clientIdParam = isClient ? client.id : undefined;

      const newComment = await addComment(activeVersionId, userIdToUse, content, isClient, clientIdParam);

      // Ajouter le nouveau commentaire à l'état local avec les bonnes informations
      if (newComment && newComment.length > 0) {
        // Créer un objet commentaire avec le bon nom d'utilisateur
        const commentWithUserInfo = {
          ...newComment[0],
          users: {
            full_name: isClient 
              ? client.name 
              : (currentUser?.full_name || freelancer?.users?.full_name || "John Doe"),
            avatar_url: isClient 
              ? client.logo_url 
              : (currentUser?.avatar_url || freelancer?.users?.avatar_url)
          },
          is_client: isClient
        };
        
        setComments((prev) => [...prev, commentWithUserInfo]);
      }
    } catch (error) {
      console.error("Error sending comment:", error);

      toast({
        title: "Erreur d'envoi",
        description: "Une erreur s'est produite lors de l'envoi du commentaire.",
        variant: "destructive",
      });
    }
  };

  return {
    comments,
    setComments,
    handleSendComment
  };
} 