"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Star, StarOff, Plus, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { checkWebsiteUpdates } from "@/app/actions"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Types
interface Bookmark {
  id: number
  url: string
  lastChecked: string
  lastUpdated: string | null
  contentHash?: string
  favorite: boolean
  error?: string
  changeDetected?: boolean
}

// Sample bookmark data
const initialBookmarks: Bookmark[] = [
  {
    id: 1,
    url: "https://nextjs.org/docs",
    lastChecked: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    lastUpdated: null,
    contentHash: "",
    favorite: true,
  },
  {
    id: 2,
    url: "https://react.dev",
    lastChecked: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 20).toISOString(),
    contentHash: "",
    favorite: true,
    changeDetected: true,
  },
  {
    id: 3,
    url: "https://vercel.com/blog",
    lastChecked: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(),
    contentHash: "",
    favorite: false,
    changeDetected: true,
  },
  {
    id: 4,
    url: "https://css-tricks.com",
    lastChecked: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    lastUpdated: null,
    contentHash: "",
    favorite: false,
  },
  {
    id: 5,
    url: "https://github.blog",
    lastChecked: new Date(Date.now() - 3600000 * 36).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
    contentHash: "",
    favorite: true,
    changeDetected: true,
  },
]

// Function to clean URL for display
const cleanUrl = (url: string): string => {
  try {
    // Ensure URL has a protocol for parsing
    let validUrl = url
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl
    }

    const urlObj = new URL(validUrl)
    let domain = urlObj.hostname

    // Remove www. prefix if present
    domain = domain.replace(/^www\./, "")

    return domain
  } catch (e) {
    return url
  }
}

// Extract title from URL
const extractTitleFromUrl = (url: string): string => {
  try {
    // Ensure URL has a protocol for parsing
    let validUrl = url
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl
    }

    const urlObj = new URL(validUrl)
    let domain = urlObj.hostname

    // Remove www. prefix if present
    domain = domain.replace(/^www\./, "")

    // Split by dots and get the main domain name
    const parts = domain.split(".")
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1)
    }

    return domain
  } catch (e) {
    return url
  }
}

export default function ReadsNow() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    // Try to load from localStorage on client side
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bookmarks")
      return saved ? JSON.parse(saved) : initialBookmarks
    }
    return initialBookmarks
  })

  const [isChecking, setIsChecking] = useState(false)
  const [checkingProgress, setCheckingProgress] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newBookmark, setNewBookmark] = useState({
    url: "",
    favorite: false,
  })
  const [urlError, setUrlError] = useState("")
  const [filter, setFilter] = useState<"all" | "favorites" | "updated">("all")

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  }, [bookmarks])

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "never"

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`

    // Format as date for older updates
    return `${Math.floor(diffInSeconds / 2592000)}mo`
  }

  // Check for updates by actually fetching website content
  const checkForUpdates = async () => {
    setIsChecking(true)
    setCheckingProgress(0)

    const total = bookmarks.length
    let completed = 0

    // Process bookmarks one by one to avoid overwhelming the server
    const updatedBookmarks = [...bookmarks]

    for (let i = 0; i < updatedBookmarks.length; i++) {
      const bookmark = updatedBookmarks[i]
      try {
        // Call the server action to check for updates
        const result = await checkWebsiteUpdates(bookmark.url, bookmark.contentHash || "")

        // Update the bookmark with the result
        updatedBookmarks[i] = {
          ...bookmark,
          lastChecked: new Date().toISOString(),
          contentHash: result.contentHash,
          error: undefined,
          changeDetected: result.hasChanged,
        }

        // If content has changed, update the lastUpdated timestamp
        if (result.hasChanged) {
          updatedBookmarks[i].lastUpdated = new Date().toISOString()
        }
      } catch (error) {
        // Handle errors
        updatedBookmarks[i] = {
          ...bookmark,
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Failed to check for updates",
        }
      }

      // Update progress
      completed++
      setCheckingProgress(Math.floor((completed / total) * 100))

      // Update state after each bookmark to show progress
      setBookmarks([...updatedBookmarks])
    }

    setIsChecking(false)
  }

  // Toggle favorite status
  const toggleFavorite = (id: number) => {
    setBookmarks(
      bookmarks.map((bookmark) => (bookmark.id === id ? { ...bookmark, favorite: !bookmark.favorite } : bookmark)),
    )
  }

  // Delete a bookmark
  const deleteBookmark = (id: number) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
  }

  // Handle adding a new bookmark
  const handleAddBookmark = () => {
    // Validate inputs
    let hasError = false

    // Basic URL validation
    try {
      // Add https:// if missing
      let url = newBookmark.url
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url
      }

      new URL(url)
      setUrlError("")

      // Update the URL with the corrected version
      setNewBookmark({ ...newBookmark, url })
    } catch (e) {
      setUrlError("Please enter a valid URL")
      hasError = true
    }

    if (hasError) return

    // Create new bookmark
    const newId = Math.max(0, ...bookmarks.map((b) => b.id)) + 1
    const bookmark: Bookmark = {
      id: newId,
      url: newBookmark.url,
      lastChecked: new Date().toISOString(),
      lastUpdated: null,
      contentHash: "",
      favorite: newBookmark.favorite,
    }

    // Add to bookmarks list
    setBookmarks([...bookmarks, bookmark])

    // Reset form and close dialog
    setNewBookmark({
      url: "",
      favorite: false,
    })
    setDialogOpen(false)
  }

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    const filtered = bookmarks.filter((bookmark) => {
      if (filter === "all") return true
      if (filter === "favorites") return bookmark.favorite
      if (filter === "updated") return bookmark.changeDetected && bookmark.lastUpdated !== null
      return true
    })

    // Sort bookmarks with newest updates at the top
    return filtered.sort((a, b) => {
      // First, prioritize bookmarks with updates
      const aHasUpdate = a.changeDetected && a.lastUpdated !== null
      const bHasUpdate = b.changeDetected && b.lastUpdated !== null

      if (aHasUpdate && !bHasUpdate) return -1
      if (!aHasUpdate && bHasUpdate) return 1

      // If both have updates or both don't have updates, sort by lastUpdated date
      if (a.lastUpdated && b.lastUpdated) {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      }

      // If only one has lastUpdated, prioritize it
      if (a.lastUpdated && !b.lastUpdated) return -1
      if (!a.lastUpdated && b.lastUpdated) return 1

      // If neither has lastUpdated, sort by lastChecked
      return new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()
    })
  }, [bookmarks, filter])

  // Count of updated bookmarks
  const updatedCount = useMemo(() => {
    return bookmarks.filter((b) => b.changeDetected && b.lastUpdated !== null).length
  }, [bookmarks])

  // Count of favorite bookmarks
  const favoritesCount = useMemo(() => {
    return bookmarks.filter((b) => b.favorite).length
  }, [bookmarks])

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar for checking */}
      {isChecking && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div
            className="h-full bg-black transition-all duration-300 ease-in-out"
            style={{ width: `${checkingProgress}%` }}
          ></div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 43 42" className="mr-2" fill="currentColor">
              <g transform="matrix(3.61815e-17,0.590889,-0.737625,4.51665e-17,154.429,7822.54)">
                <g transform="matrix(1,0,0,1,0,-3)">
                  <rect x="-13238.6" y="155.043" width="70.959" height="25.698" />
                </g>
                <g transform="matrix(1,0,0,1,0,28.6175)">
                  <rect x="-13238.6" y="155.043" width="70.959" height="25.698" />
                </g>
              </g>
            </svg>
            <h1 className="text-xl font-bold">Reads.now</h1>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Filter size={16} className="mr-1" />
                  {filter === "all" ? "All" : filter === "favorites" ? "Favorites" : "Updated"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  All
                  <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("favorites")}>
                  Favorites
                  <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{favoritesCount}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("updated")}>
                  Updated
                  <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{updatedCount}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus size={16} className="mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Read</DialogTitle>
                  <DialogDescription>Enter the URL of the website you want to bookmark.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                      placeholder="example.com"
                    />
                    {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="favorite"
                      checked={newBookmark.favorite}
                      onCheckedChange={(checked) => setNewBookmark({ ...newBookmark, favorite: checked })}
                    />
                    <Label htmlFor="favorite">Add to favorites</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddBookmark}>
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={isChecking} className="h-8">
              <RefreshCw size={16} className={cn("mr-1", isChecking && "animate-spin")} />
              {isChecking ? "Checking" : "Check"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-3xl mx-auto px-4 py-6">
        {filteredBookmarks.length > 0 ? (
          <div className="space-y-6">
            {filteredBookmarks.map((bookmark) => {
              const isRecentlyUpdated =
                bookmark.lastUpdated &&
                new Date(bookmark.lastUpdated).getTime() > new Date(Date.now() - 3600000 * 24).getTime()

              const title = extractTitleFromUrl(bookmark.url)
              const domain = cleanUrl(bookmark.url)

              return (
                <div
                  key={bookmark.id}
                  className={cn(
                    "border-b border-gray-100 pb-6",
                    bookmark.changeDetected && isRecentlyUpdated && "bg-gray-50 -mx-4 px-4 py-4 rounded-md",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-xl hover:underline block",
                          bookmark.changeDetected && isRecentlyUpdated && "font-medium",
                        )}
                      >
                        {title}
                      </a>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mt-2">
                        <span className="mr-3">{domain}</span>
                        {bookmark.lastUpdated ? (
                          <span className="flex items-center">
                            {bookmark.changeDetected && isRecentlyUpdated && (
                              <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white mr-2">
                                new
                              </span>
                            )}
                            updated {formatRelativeTime(bookmark.lastUpdated)} ago
                          </span>
                        ) : (
                          <span>never updated</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(bookmark.id)}
                        className="h-8 w-8 text-gray-500 hover:text-black"
                      >
                        {bookmark.favorite ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {bookmark.error && <div className="mt-2 text-sm text-red-500">Error: {bookmark.error}</div>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No bookmarks found</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first read
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Read</DialogTitle>
                  <DialogDescription>Enter the URL of the website you want to bookmark.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="url-empty">URL</Label>
                    <Input
                      id="url-empty"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                      placeholder="example.com"
                    />
                    {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="favorite-empty"
                      checked={newBookmark.favorite}
                      onCheckedChange={(checked) => setNewBookmark({ ...newBookmark, favorite: checked })}
                    />
                    <Label htmlFor="favorite-empty">Add to favorites</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddBookmark}>
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  )
}
