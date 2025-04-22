"use client"

import { useState } from "react"
import { Search, Filter, X, Calendar, User, Tag, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  fileTypes?: string[]
  users?: { id: string; name: string }[]
  tags?: string[]
}

export interface SearchFilters {
  query: string
  fileTypes: string[]
  users: string[]
  tags: string[]
  dateFrom?: Date
  dateTo?: Date
  status?: string
}

export function AdvancedSearch({ onSearch, fileTypes = [], users = [], tags = [] }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)

  const hasActiveFilters =
    selectedFileTypes.length > 0 ||
    selectedUsers.length > 0 ||
    selectedTags.length > 0 ||
    dateFrom !== undefined ||
    dateTo !== undefined ||
    status !== undefined

  const handleSearch = () => {
    onSearch({
      query: searchQuery,
      fileTypes: selectedFileTypes,
      users: selectedUsers,
      tags: selectedTags,
      dateFrom,
      dateTo,
      status,
    })
  }

  const clearFilters = () => {
    setSelectedFileTypes([])
    setSelectedUsers([])
    setSelectedTags([])
    setDateFrom(undefined)
    setDateTo(undefined)
    setStatus(undefined)
  }

  const toggleFileType = (fileType: string) => {
    setSelectedFileTypes((prev) =>
      prev.includes(fileType) ? prev.filter((type) => type !== fileType) : [...prev, fileType],
    )
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-9 pr-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 px-0"
            onClick={() => {
              setSearchQuery("")
              handleSearch()
            }}
            disabled={!searchQuery}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        </div>

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
              <span>Filtres</span>
              {hasActiveFilters && (
                <Badge className="ml-1 bg-primary-foreground text-primary hover:bg-primary-foreground">
                  {selectedFileTypes.length +
                    selectedUsers.length +
                    selectedTags.length +
                    (dateFrom ? 1 : 0) +
                    (dateTo ? 1 : 0) +
                    (status ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              {fileTypes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Type de fichier</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fileTypes.map((fileType) => (
                      <div key={fileType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`file-type-${fileType}`}
                          checked={selectedFileTypes.includes(fileType)}
                          onCheckedChange={() => toggleFileType(fileType)}
                        />
                        <Label htmlFor={`file-type-${fileType}`} className="text-sm font-normal cursor-pointer">
                          {fileType.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {users.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Utilisateur</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-normal cursor-pointer">
                          {user.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Tags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Date</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="date-from" className="text-xs">
                      De
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal h-8 text-xs"
                        >
                          {dateFrom ? (
                            dateFrom.toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">Choisir...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date-to" className="text-xs">
                      À
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal h-8 text-xs"
                        >
                          {dateTo ? (
                            dateTo.toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">Choisir...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Statut
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="h-8 text-xs">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Effacer les filtres
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    handleSearch()
                    setFilterOpen(false)
                  }}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" onClick={handleSearch} size="sm" className="h-9">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>

          {selectedFileTypes.map((fileType) => (
            <Badge key={fileType} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>Type: {fileType.toUpperCase()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleFileType(fileType)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove file type filter</span>
              </Button>
            </Badge>
          ))}

          {selectedUsers.map((userId) => {
            const user = users.find((u) => u.id === userId)
            return (
              <Badge key={userId} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
                <span>Par: {user?.name || userId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => toggleUser(userId)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove user filter</span>
                </Button>
              </Badge>
            )
          })}

          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>Tag: {tag}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => toggleTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove tag filter</span>
              </Button>
            </Badge>
          ))}

          {dateFrom && (
            <Badge variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>De: {dateFrom.toLocaleDateString()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setDateFrom(undefined)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove date from filter</span>
              </Button>
            </Badge>
          )}

          {dateTo && (
            <Badge variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>À: {dateTo.toLocaleDateString()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setDateTo(undefined)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove date to filter</span>
              </Button>
            </Badge>
          )}

          {status && (
            <Badge variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
              <span>
                Statut:{" "}
                {status === "approved"
                  ? "Approuvé"
                  : status === "pending"
                    ? "En attente"
                    : status === "rejected"
                      ? "Rejeté"
                      : status}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setStatus(undefined)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove status filter</span>
              </Button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  )
}
