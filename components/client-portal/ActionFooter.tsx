"use client"

import { Button } from "@/components/ui/button"
import { ApprovalDialog } from "@/components/approval-dialog"
import { Version } from "./types"

interface ActionFooterProps {
  activeVersion: Version | null
  clientId: string
  userId?: string
  onRefresh: () => Promise<void>
}

export function ActionFooter({
  activeVersion,
  clientId,
  userId,
  onRefresh
}: ActionFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-md shadow-sm hover:shadow transition-shadow duration-200 mt-auto sticky bottom-0 border-t border-slate-200">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div>
          <div>
            <p className="text-sm font-medium">
              Delivered on {activeVersion ? new Date(activeVersion.created_at).toLocaleDateString() : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeVersion?.status === "approved" 
                ? "Approved" 
                : activeVersion?.status === "rejected"
                  ? "Changes requested"
                  : "Waiting for your approval"}
            </p>
          </div>
        </div>
      </div>

      {activeVersion && activeVersion.id ? (
        <ApprovalDialog
          deliverableId={activeVersion.id}
          clientId={clientId}
          user_id={userId}
          isApproved={activeVersion.status === "approved"}
          onApproved={() => {
            onRefresh()
          }}
          onRejected={() => {
            onRefresh()
          }}
        />
      ) : (
        <Button disabled className="w-full sm:w-auto gap-2 h-9 bg-slate-100 text-slate-700 opacity-50">
          <span>No Version Available</span>
        </Button>
      )}
    </div>
  )
} 