"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { approveDeliverable, rejectDeliverable } from "@/services/project-service"

interface ApprovalDialogProps {
  deliverableId: string
  clientId: string
  user_id?: string
  onApproved?: () => void
  onRejected?: () => void
  isApproved?: boolean
}

export function ApprovalDialog({
  deliverableId,
  clientId,
  user_id,
  onApproved,
  onRejected,
  isApproved = false,
}: ApprovalDialogProps) {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<"approve" | "reject">("approve")

  const handleApprove = async () => {
    if (isApproved) return

    setIsSubmitting(true)
    try {
      await approveDeliverable(deliverableId, clientId)
      setOpen(false)
      
      // Ajouter un paramètre à l'URL pour indiquer que l'approbation vient de se produire
      window.location.href = window.location.pathname + '?approved=true';
      
      // Plus besoin d'appeler onApproved car la page va se recharger
    } catch (error) {
      console.error("Error approving deliverable:", error)
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)
    try {
      // Utiliser l'ID de l'utilisateur connecté ou une valeur par défaut
      const effectiveUserId = user_id || clientId || "00000000-0000-0000-0000-000000000000";
      
      await rejectDeliverable(deliverableId, clientId, feedback, effectiveUserId)
      setOpen(false)
      if (onRejected) onRejected()
    } catch (error) {
      console.error("Error rejecting deliverable:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDialog = (action: "approve" | "reject") => {
    setMode(action)
    setOpen(true)
  }

  return (
    <div className="w-full sm:w-auto">
      {isApproved ? (
        <Button className="w-full gap-2 h-9 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" disabled>
          <Check className="h-4 w-4" />
          <span>Already Approved</span>
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="w-full gap-2 h-9 bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            onClick={() => openDialog("approve")}
          >
            <Check className="h-4 w-4" />
            <span>Approve</span>
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 h-9 text-red-600 border-red-200 hover:bg-red-50 transition-colors"
            onClick={() => openDialog("reject")}
          >
            <X className="h-4 w-4" />
            <span>Request Changes</span>
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{mode === "approve" ? "Approve Deliverable" : "Request Changes"}</DialogTitle>
            <DialogDescription>
              {mode === "approve"
                ? "Are you sure you want to approve this deliverable? This will move the project to the next phase."
                : "Please provide feedback on what changes are needed."}
            </DialogDescription>
          </DialogHeader>

          {mode === "reject" && (
            <div className="py-4">
              <Textarea
                placeholder="Describe what changes you'd like to see..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            {mode === "approve" ? (
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? "Approving..." : "Approve"}
              </Button>
            ) : (
              <Button
                onClick={handleReject}
                disabled={!feedback.trim() || isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
