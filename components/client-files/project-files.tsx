"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  ImageIcon,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Search,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { UploadFileDialog } from "../upload-file-dialog"
import { FilePreviewDialog } from "../file-preview-dialog"
import { deleteSharedFile } from "@/services/project-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { fetchProjectDeliverables, Deliverable } from "../../hooks/useProjectDeliverables"

interface ProjectFilesProps {
  files?: any[]
  projectId: string
  clientId: string
  onFileDeleted?: () => void
  projectSteps?: any[]
}

export function ProjectFiles({ files = [], projectId, clientId, onFileDeleted, projectSteps = [] }: ProjectFilesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [filterOpen, setFilterOpen] = useState(false)
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([])
  const [uploadedByFilter, setUploadedByFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [stepFilter, setStepFilter] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadingSteps, setLoadingSteps] = useState(false)
  const [projectMilestones, setProjectMilestones] = useState<any[]>(projectSteps)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [isLoadingDeliverables, setIsLoadingDeliverables] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project deliverables
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return
      
      setIsLoadingDeliverables(true)
      setError(null)
      
      try {
        const result = await fetchProjectDeliverables(projectId)
        console.log("Fetched project deliverables:", result)
        setDeliverables(result || [])
        
        // If we have deliverables but no steps, try to extract step info
        if (result?.length > 0 && projectSteps.length === 0) {
          const uniqueSteps = Array.from(
            new Set(
              result
                .filter((d: Deliverable) => d.step_id)
                .map((d: Deliverable) => JSON.stringify({ id: d.step_id, name: d.step_name || "Unknown Step" }))
            )
          ).map(s => JSON.parse(s as string))
          
          setProjectMilestones(uniqueSteps)
        }
      } catch (error) {
        console.error("Error fetching project deliverables:", error)
        setError("Failed to load deliverables. Please try again.")
      } finally {
        setIsLoadingDeliverables(false)
      }
    }
    
    fetchData()
  }, [projectId, projectSteps.length])

  // Fetch project steps if not provided
  useEffect(() => {
    async function fetchProjectSteps() {
      if (projectSteps.length === 0 && projectId) {
        setLoadingSteps(true)
        try {
          // Implement actual API call to fetch project steps
          // const response = await fetch(`/api/projects/${projectId}/steps`)
          // const data = await response.json()
          // setProjectMilestones(data)
          console.log("Would fetch steps for project:", projectId)
        } catch (error) {
          console.error("Error fetching project steps:", error)
        } finally {
          setLoadingSteps(false)
        }
      }
    }
    
    fetchProjectSteps()
  }, [projectId, projectSteps])

  // Extract all step IDs from the project
  const projectStepIds = projectMilestones.map(step => step.id)
  
  // Generate step information lookup for display purposes
  const stepInfoMap = Object.fromEntries(
    projectMilestones.map(step => [step.id, { 
      name: step.name || "Unnamed Step", 
      order: step.order || 0,
      status: step.status || "Pending"
    }])
  )
  
  // Use deliverables from the API instead of files prop
  const projectDeliverables = deliverables.length > 0 
    ? deliverables 
    : files.filter(file => file.project_id === projectId)

  // Get unique file types and uploaders for filters from the filtered deliverables
  const fileTypes = Array.from(new Set(projectDeliverables.map((file) => file.file_type).filter(Boolean)))
  const uploaders = Array.from(new Set(projectDeliverables.map((file) => (file.is_client ? "You" : "Designer"))))
  const statuses = Array.from(new Set(projectDeliverables.map((file) => file.status || "Pending Review")))
  const steps = Array.from(new Set(projectDeliverables.filter(file => file.step_id).map(file => file.step_id)))

  // Apply filters and search to the project deliverables
  const filteredFiles = projectDeliverables.filter((file) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !file.title?.toLowerCase().includes(query) &&
        !file.description?.toLowerCase().includes(query) &&
        !file.file_name?.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // File type filter
    if (fileTypeFilter.length > 0 && !fileTypeFilter.includes(file.file_type)) {
      return false
    }

    // Uploader filter
    const uploaderValue = file.is_client ? "You" : "Designer"
    if (uploadedByFilter.length > 0 && !uploadedByFilter.includes(uploaderValue)) {
      return false
    }

    // Status filter
    if (statusFilter.length > 0 && !statusFilter.includes(file.status)) {
      return false
    }

    // Step filter
    if (stepFilter.length > 0) {
      if (!file.step_id) {
        // If "Project-wide" is in the filter but the file has no step_id, show it
        if (!stepFilter.includes("project-wide")) {
          return false;
        }
      } else if (!stepFilter.includes(file.step_id)) {
        return false;
      }
    }

    return true
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "jpg":
      case "png":
        return <ImageIcon className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getFilePreview = (file: any) => {
    if (file.preview_url) {
      return (
        <div className="relative h-32 w-full overflow-hidden rounded-t-md bg-muted">
          <img
            src={file.preview_url || "/placeholder.svg"}
            alt={file.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )
    }

    return (
      <div className="flex h-32 w-full items-center justify-center rounded-t-md bg-muted">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
          {file.file_type === "pdf" && <FileText className="h-8 w-8 text-red-500" />}
          {file.file_type === "docx" && <FileText className="h-8 w-8 text-blue-500" />}
          {(file.file_type === "jpg" || file.file_type === "png") && <ImageIcon className="h-8 w-8 text-purple-500" />}
          {!["pdf", "docx", "jpg", "png"].includes(file.file_type) && <FileText className="h-8 w-8 text-gray-500" />}
        </div>
      </div>
    )
  }

  const toggleFileTypeFilter = (fileType: string) => {
    if (fileTypeFilter.includes(fileType)) {
      setFileTypeFilter(fileTypeFilter.filter((type) => type !== fileType))
    } else {
      setFileTypeFilter([...fileTypeFilter, fileType])
    }
  }

  const toggleUploadedByFilter = (uploader: string) => {
    if (uploadedByFilter.includes(uploader)) {
      setUploadedByFilter(uploadedByFilter.filter((u) => u !== uploader))
    } else {
      setUploadedByFilter([...uploadedByFilter, uploader])
    }
  }

  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status))
    } else {
      setStatusFilter([...statusFilter, status])
    }
  }

  const toggleStepFilter = (stepId: string) => {
    if (stepFilter.includes(stepId)) {
      setStepFilter(stepFilter.filter((s) => s !== stepId))
    } else {
      setStepFilter([...stepFilter, stepId])
    }
  }

  const clearFilters = () => {
    setFileTypeFilter([])
    setUploadedByFilter([])
    setStatusFilter([])
    setStepFilter([])
    setSearchQuery("")
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    setIsDeleting(true)
    try {
      await deleteSharedFile(fileToDelete)
      setDeleteDialogOpen(false)
      setFileToDelete(null)
      if (onFileDeleted) onFileDeleted()
    } catch (error) {
      console.error("Error deleting file:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = (fileId: string) => {
    setFileToDelete(fileId)
    setDeleteDialogOpen(true)
  }

  const hasActiveFilters = 
    fileTypeFilter.length > 0 || 
    uploadedByFilter.length > 0 || 
    statusFilter.length > 0 || 
    stepFilter.length > 0 || 
    searchQuery.length > 0

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    let badgeStyle = "bg-slate-100 text-slate-700 hover:bg-slate-100";
    let icon = null;
    
    if (status === "Approved") {
      badgeStyle = "bg-green-50 text-green-700 hover:bg-green-50";
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
    } else if (status === "In Progress") {
      badgeStyle = "bg-blue-50 text-blue-700 hover:bg-blue-50";
      icon = <Clock className="h-3 w-3 mr-1" />;
    } else if (status === "Pending Review") {
      badgeStyle = "bg-yellow-50 text-yellow-700 hover:bg-yellow-50";
      icon = <Clock className="h-3 w-3 mr-1" />;
    }
    
    return (
      <Badge variant="outline" className={`${badgeStyle} flex items-center h-5 text-xs`}>
        {icon}
        {status}
      </Badge>
    );
  };

  const getDeadlineStatus = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        label: "Overdue",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
        style: "bg-red-50 text-red-700 hover:bg-red-50",
      };
    } else if (diffDays <= 2) {
      return {
        label: `Due soon (${diffDays} day${diffDays === 1 ? '' : 's'})`,
        icon: <Clock className="h-3 w-3 mr-1" />,
        style: "bg-orange-50 text-orange-700 hover:bg-orange-50",
      };
    } else {
      return {
        label: `Due in ${diffDays} days`,
        icon: <CalendarClock className="h-3 w-3 mr-1" />,
        style: "bg-blue-50 text-blue-700 hover:bg-blue-50",
      };
    }
  };

  // Helper to get step name for display
  const getStepName = (stepId: string) => {
    return stepInfoMap[stepId]?.name || "Unknown Step";
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <h2 className="text-xl font-semibold">Shared Files</h2>
          <p className="text-sm text-muted-foreground">Files shared with you by the designer</p>
        </div>
        <div className="flex items-center gap-2">
          <UploadFileDialog
            projectId={projectId}
            userId="550e8400-e29b-41d4-a716-446655440001" // ID du client
            isClient={true}
            clientId={clientId}
            onUploadComplete={onFileDeleted}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 self-end">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-1.5",
                  hasActiveFilters &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                )}
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-primary-foreground text-primary hover:bg-primary-foreground">
                    {fileTypeFilter.length + uploadedByFilter.length + statusFilter.length + stepFilter.length + (searchQuery ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">File Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileTypes.map((fileType) => (
                      <Button
                        key={fileType}
                        variant={fileTypeFilter.includes(fileType) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleFileTypeFilter(fileType)}
                      >
                        {fileType.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Uploaded By</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploaders.map((uploader) => (
                      <Button
                        key={uploader}
                        variant={uploadedByFilter.includes(uploader) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleUploadedByFilter(uploader)}
                      >
                        {uploader}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter.includes(status) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleStatusFilter(status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Step</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      key="project-wide"
                      variant={stepFilter.includes("project-wide") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleStepFilter("project-wide")}
                    >
                      Project-wide
                    </Button>
                    {projectMilestones.map((step) => (
                      <Button
                        key={step.id}
                        variant={stepFilter.includes(step.id) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleStepFilter(step.id)}
                      >
                        {step.name || `Step ${step.order || "#"}`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear filters
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={() => setFilterOpen(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-r-none border-r", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-l-none", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>Search: {searchQuery}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove search filter</span>
              </Button>
            </Badge>
          )}

          {fileTypeFilter.map((fileType) => (
            <Badge key={fileType} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>Type: {fileType.toUpperCase()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleFileTypeFilter(fileType)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove file type filter</span>
              </Button>
            </Badge>
          ))}

          {uploadedByFilter.map((uploader) => (
            <Badge key={uploader} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>By: {uploader}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleUploadedByFilter(uploader)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove uploader filter</span>
              </Button>
            </Badge>
          ))}

          {statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>Status: {status}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleStatusFilter(status)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove status filter</span>
              </Button>
            </Badge>
          ))}

          {stepFilter.map((stepId) => (
            <Badge key={stepId} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>
                Step: {stepId === "project-wide" ? "Project-wide" : getStepName(stepId)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleStepFilter(stepId)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove step filter</span>
              </Button>
            </Badge>
          ))}

          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 bg-white" 
            onClick={() => {
              setIsLoadingDeliverables(true);
              setError(null);
              fetchProjectDeliverables(projectId)
                .then((result: Deliverable[]) => {
                  setDeliverables(result || []);
                  // Process steps if needed
                  if (result?.length > 0 && projectSteps.length === 0) {
                    const uniqueSteps = Array.from(
                      new Set(
                        result
                          .filter((d: Deliverable) => d.step_id)
                          .map((d: Deliverable) => JSON.stringify({ id: d.step_id, name: d.step_name || "Unknown Step" }))
                      )
                    ).map(s => JSON.parse(s as string));
                    
                    setProjectMilestones(uniqueSteps);
                  }
                })
                .catch((err: Error) => {
                  console.error("Error fetching deliverables:", err);
                  setError("Failed to load deliverables. Please try again.");
                })
                .finally(() => {
                  setIsLoadingDeliverables(false);
                });
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {isLoadingDeliverables ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading deliverables for project #{projectId}...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No deliverables found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {hasActiveFilters
              ? "Try adjusting your filters to find what you're looking for."
              : `There are no deliverables available for project #${projectId} yet.`}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Version</TableHead>
                    <TableHead className="hidden md:table-cell">Step</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Deadline</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.file_type)}
                          <span className="text-xs font-medium">{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{file.title}</p>
                          <p className="text-xs text-muted-foreground hidden md:block">{file.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs">{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs">{file.version || "1.0"}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {file.step_id ? (
                          <span className="text-xs">{getStepName(file.step_id)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Project-wide</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getStatusBadge(file.status || "Pending Review")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {file.due_date && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{new Date(file.due_date).toLocaleDateString()}</span>
                            {(() => {
                              const deadlineStatus = getDeadlineStatus(file.due_date);
                              return deadlineStatus && (
                                <Badge 
                                  variant="outline" 
                                  className={`${deadlineStatus.style} flex items-center h-5 text-xs px-1.5`}
                                >
                                  {deadlineStatus.icon}
                                  <span className="text-xs">{deadlineStatus.label}</span>
                                </Badge>
                              );
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs">{file.is_client ? "You" : "Designer"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <FilePreviewDialog
                                file={file}
                                trigger={
                                  <button className="flex w-full items-center cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </button>
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {file.is_client && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(file.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden transition-all hover:shadow">
                  <FilePreviewDialog
                    file={file}
                    trigger={<div className="cursor-pointer">{getFilePreview(file)}</div>}
                  />
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {getFileIcon(file.file_type)}
                        <span className="text-xs font-medium">{file.file_type.toUpperCase()}</span>
                      </div>
                      {getStatusBadge(file.status || "Pending Review")}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{file.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{file.description}</p>
                    {file.step_id && (
                      <p className="text-xs text-blue-600 mt-1">
                        {getStepName(file.step_id)}
                      </p>
                    )}
                    {file.due_date && (
                      <div className="mt-1.5">
                        {(() => {
                          const deadlineStatus = getDeadlineStatus(file.due_date);
                          return deadlineStatus && (
                            <Badge 
                              variant="outline" 
                              className={`${deadlineStatus.style} flex items-center h-5 text-xs w-fit`}
                            >
                              {deadlineStatus.icon}
                              <span>Due: {new Date(file.due_date).toLocaleDateString()}</span>
                            </Badge>
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      <span>Version: {file.version || "1.0"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 pt-0 flex justify-between">
                    <FilePreviewDialog
                      file={file}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 text-xs w-full">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="sm" className="h-7 text-xs w-full">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                    {file.is_client && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => confirmDelete(file.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteFile()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
