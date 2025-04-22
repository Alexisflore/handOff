"use client"

import { useState } from "react"
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
import { UploadFileDialog } from "./upload-file-dialog"
import { FilePreviewDialog } from "./file-preview-dialog"
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

interface ProjectFilesProps {
  files: any[]
  projectId: string
  clientId: string
  onFileDeleted?: () => void
}

export function ProjectFiles({ files = [], projectId, clientId, onFileDeleted }: ProjectFilesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [filterOpen, setFilterOpen] = useState(false)
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([])
  const [uploadedByFilter, setUploadedByFilter] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get unique file types and uploaders for filters
  const fileTypes = Array.from(new Set(files.map((file) => file.file_type)))
  const uploaders = Array.from(new Set(files.map((file) => (file.is_client ? "You" : "Designer"))))

  // Apply filters and search
  const filteredFiles = files.filter((file) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !file.title.toLowerCase().includes(query) &&
        !file.description.toLowerCase().includes(query) &&
        !file.file_name.toLowerCase().includes(query)
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

  const clearFilters = () => {
    setFileTypeFilter([])
    setUploadedByFilter([])
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

  const hasActiveFilters = fileTypeFilter.length > 0 || uploadedByFilter.length > 0 || searchQuery.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Files</h2>
          <p className="text-sm text-muted-foreground">Files shared between you and your designer</p>
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
                    {fileTypeFilter.length + uploadedByFilter.length + (searchQuery ? 1 : 0)}
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

          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No files found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {hasActiveFilters
              ? "Try adjusting your filters to find what you're looking for."
              : "There are no files available. Upload a file to get started."}
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
                    <TableHead className="hidden md:table-cell">Size</TableHead>
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
                        <span className="text-xs">{file.file_size}</span>
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
                      <Badge
                        variant="outline"
                        className={
                          file.status === "New"
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs h-5"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs h-5"
                        }
                      >
                        {file.status}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{file.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{file.description}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      <span>{file.file_size}</span>
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
