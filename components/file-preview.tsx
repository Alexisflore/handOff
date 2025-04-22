"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react"

import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  fileType: "image" | "pdf" | "other"
  fileName: string
  fileUrl: string
}

export function FilePreview({ fileType, fileName, fileUrl }: FilePreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)

  const totalPages = fileType === "pdf" ? 5 : 1 // Simulate multiple pages for PDFs

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25)
  }

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {fileType === "pdf" && (
            <div className="flex items-center mr-3 bg-white border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{currentPage}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="text-sm font-medium">{fileName}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border rounded-md mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-8 w-8 hover:bg-slate-200 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center font-medium">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-8 w-8 hover:bg-slate-200 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-slate-100 flex-1 overflow-auto flex items-center justify-center bg-[url('/placeholder.svg?height=20&width=20&text=.')]">
        <div
          style={{ transform: `scale(${zoom / 100})`, transition: "transform 0.2s ease" }}
          className="p-4 transition-transform"
        >
          {fileType === "image" ? (
            <div className="shadow-md rounded-md overflow-hidden border border-white">
              <Image
                src={fileUrl || "/placeholder.svg?height=500&width=375"}
                alt={fileName}
                width={500}
                height={375}
                className="object-contain"
              />
            </div>
          ) : fileType === "pdf" ? (
            <div
              className="bg-white shadow-md rounded-md overflow-hidden border border-white"
              style={{ width: "500px", height: "375px" }}
            >
              <Image
                src="/placeholder.svg?height=500&width=375&text=Page+Preview"
                alt={`Page ${currentPage}`}
                width={500}
                height={375}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white p-6 rounded-md shadow-md">
              <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
