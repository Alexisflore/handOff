import { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProjectDeliverable } from "@/components/project-files/types"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface FilePreviewDialogProps {
  file: ProjectDeliverable
  trigger: ReactNode
}

export function FilePreviewDialog({ file, trigger }: FilePreviewDialogProps) {
  const renderPreview = () => {
    if (file.preview_url) {
      return <img src={file.preview_url} alt={file.title} className="max-h-[70vh] object-contain" />
    }
    
    if (file.file_type === "pdf" && file.file_url) {
      return (
        <iframe 
          src={file.file_url} 
          className="w-full h-[70vh]" 
          title={file.title}
        />
      )
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <p className="text-muted-foreground mb-4">No preview available</p>
        {file.file_url && (
          <Button onClick={() => window.open(file.file_url, '_blank')}>
            <Download className="mr-2 h-4 w-4" />
            Download to view
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
} 