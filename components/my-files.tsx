"use client"

import { useState } from "react"
import { Calendar, Download, Eye, FileText, ImageIcon, MoreHorizontal, Trash2, FileUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for uploaded files
const sampleFiles = [
  {
    id: "1",
    title: "Feedback on Homepage",
    description: "My thoughts on the current design",
    fileName: "homepage_feedback.pdf",
    fileType: "pdf",
    fileSize: "1.2 MB",
    uploadDate: "Apr 10, 2025",
    status: "Viewed",
  },
  {
    id: "2",
    title: "Logo Alternatives",
    description: "Some ideas for the logo",
    fileName: "logo_alternatives.zip",
    fileType: "zip",
    fileSize: "4.5 MB",
    uploadDate: "Apr 8, 2025",
    status: "New",
  },
  {
    id: "3",
    title: "Content for About Page",
    description: "Draft content for the about section",
    fileName: "about_content.docx",
    fileType: "docx",
    fileSize: "0.8 MB",
    uploadDate: "Apr 5, 2025",
    status: "Viewed",
  },
  {
    id: "4",
    title: "Reference Images",
    description: "Examples of styles I like",
    fileName: "reference_images.zip",
    fileType: "zip",
    fileSize: "8.2 MB",
    uploadDate: "Apr 2, 2025",
    status: "Viewed",
  },
]

export function MyFiles() {
  const [files, setFiles] = useState(sampleFiles)

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Files</h2>
          <p className="text-sm text-muted-foreground">Files shared between you and your designer</p>
        </div>
        <Button className="gap-2 sm:w-auto">
          <FileUp className="h-4 w-4" />
          <span>Upload File</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Files you've shared or received</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.fileType)}
                      <span className="text-xs font-medium">{file.fileName}</span>
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
                      <span className="text-xs">{file.uploadDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs">{file.fileSize}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={
                        file.status === "New"
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {file.status}
                    </Badge>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
