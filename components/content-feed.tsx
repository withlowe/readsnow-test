"use client"

import { useState, useEffect, useRef } from "react"
import { useUserbase } from "@/components/userbase-provider"
import { WebsiteItem } from "@/components/website-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Plus } from "lucide-react"
import { checkWebsiteForUpdates } from "@/utils/website-checker"
import { AddWebsiteDialog } from "@/components/add-website-dialog"

type Website = {
  itemId: string
  url: string
  title: string
  description?: string
  category: string
  createdAt: string
  updatedAt: string
  lastChecked?: string
  contentSnapshot?: string
  previousSnapshot?: string
  mainContent?: string
  isRssFeed?: boolean
  feedItems?: any[]
  contentChanged?: boolean
  contentChangedAt?: string
}

export function ContentFeed() {
  const { userbase } = useUserbase()
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (userbase) {
      initDatabase()
    }

    // Cleanup function
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [userbase])

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && !autoRefreshIntervalRef.current) {
      // Check for updates every 5 minutes
      autoRefreshIntervalRef.current = setInterval(() => {
        // Only refresh if it's been at least 5 minutes since the last refresh
        const now = Date.now()
        if (now - lastRefreshTimeRef.current >= 5 * 60 * 1000) {
          console.log("Auto-refreshing feed...")
          refreshWebsites(true) // true = silent refresh
          lastRefreshTimeRef.current = now
        }
      }, 60 * 1000) // Check every minute, but only refresh if 5 minutes have passed
    } else if (!autoRefresh && autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current)
      autoRefreshIntervalRef.current = null
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  // Function to sort websites by most recent external content change
  const sortWebsitesByContentChange = (sites: Website[]) => {
    return [...sites].sort((a, b) => {
      // Prioritize sites with contentChangedAt (external updates)
      const aDate = a.contentChangedAt ? new Date(a.contentChangedAt).getTime() : 0
      const bDate = b.contentChangedAt ? new Date(b.contentChangedAt).getTime() : 0

      // If both have contentChangedAt, sort by that date
      if (aDate && bDate) {
        return bDate - aDate
      }

      // If only one has contentChangedAt, prioritize that one
      if (aDate && !bDate) return -1
      if (!aDate && bDate) return 1

      // If neither has contentChangedAt, fall back to updatedAt or createdAt
      const aFallbackDate = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime()
      const bFallbackDate = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime()

      return bFallbackDate - aFallbackDate
    })
  }

  const initDatabase = async () => {
    setIsLoading(true)
    try {
      await userbase.openDatabase({
        databaseName: "websites",
        changeHandler: (items: any) => {
          // Map items to our Website type
          const websiteItems = items.map((item: any) => ({
            itemId: item.itemId,
            ...item.item,
          }))

          // Sort by content change date, newest first
          const sortedItems = sortWebsitesByContentChange(websiteItems)

          // Debug log to check sorting
          console.log(
            "Sorted websites:",
            sortedItems.map((site) => ({
              title: site.title,
              contentChangedAt: site.contentChangedAt,
              updatedAt: site.updatedAt,
              createdAt: site.createdAt,
            })),
          )

          setWebsites(sortedItems)
          setIsLoading(false)
        },
      })
    } catch (error: any) {
      console.error("Error opening database:", error)
      toast({
        title: "Error loading websites",
        description: error.message || "Something went wrong",
      })
      setIsLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!userbase) return

    try {
      await userbase.deleteItem({
        databaseName: "websites",
        itemId,
      })

      toast({
        title: "Website removed",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing website",
        description: error.message || "Something went wrong",
      })
    }
  }

  const handleUpdate = async (itemId: string, updates: any) => {
    if (!userbase) return

    try {
      await userbase.updateItem({
        databaseName: "websites",
        itemId,
        item: updates,
      })

      toast({
        title: "Website updated",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating website",
        description: error.message || "Something went wrong",
      })
    }
  }

  const refreshWebsites = async (silent = false) => {
    if (!userbase || isRefreshing || websites.length === 0) return

    setIsRefreshing(true)
    if (!silent) {
      toast({
        title: "Refreshing websites",
      })
    }

    let updatedCount = 0

    // Process websites in batches to avoid overwhelming the browser
    const batchSize = 5
    const batches = Math.ceil(websites.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, websites.length)
      const batch = websites.slice(start, end)

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (website) => {
          if (!website.url) return { website, updated: false }

          const websiteData = await checkWebsiteForUpdates(website.url)
          if (!websiteData) return { website, updated: false }

          // Create a new content snapshot that includes main content
          const newContentSnapshot = [
            websiteData.title || "",
            websiteData.description || "",
            websiteData.mainContent ? websiteData.mainContent.substring(0, 200) : "",
          ]
            .join(" ")
            .substring(0, 500)

          const oldContentSnapshot = website.contentSnapshot || ""
          const hasChanged = oldContentSnapshot !== newContentSnapshot

          if (hasChanged) {
            // Prepare feed items with limited size
            const feedItems = websiteData.feedItems
              ? websiteData.feedItems.slice(0, 3).map((item) => ({
                  title: item.title.substring(0, 100),
                  description: item.description ? item.description.substring(0, 100) : "",
                  content: item.content ? item.content.substring(0, 100) : "",
                  pubDate: item.pubDate,
                }))
              : website.feedItems

            const now = new Date().toISOString()

            await userbase.updateItem({
              databaseName: "websites",
              itemId: website.itemId,
              item: {
                title: websiteData.title || website.title,
                description: websiteData.description ? websiteData.description.substring(0, 200) : website.description,
                previousSnapshot: oldContentSnapshot.substring(0, 500),
                contentSnapshot: newContentSnapshot,
                mainContent: websiteData.mainContent ? websiteData.mainContent.substring(0, 1000) : "",
                updatedAt: now,
                contentChangedAt: now, // Set content change timestamp for external updates
                contentChanged: true, // Mark as having changed content
                lastChecked: now,
                feedItems: feedItems,
                isRssFeed: websiteData.isRssFeed || website.isRssFeed,
              },
            })
            updatedCount++
            return { website, updated: true }
          } else {
            // Update just the lastChecked timestamp without changing contentChangedAt
            await userbase.updateItem({
              databaseName: "websites",
              itemId: website.itemId,
              item: {
                lastChecked: new Date().toISOString(),
                // Don't update contentChangedAt or updatedAt to preserve sorting
              },
            })
            return { website, updated: false }
          }
        }),
      )

      // Small delay between batches to avoid rate limiting
      if (i < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // After all updates, refresh the database to get the latest sorted items
    setIsRefreshing(false)

    // Force refresh the database to get the latest sorted items
    await initDatabase()

    if (!silent && updatedCount > 0) {
      toast({
        title: `Updated ${updatedCount} website${updatedCount === 1 ? "" : "s"}`,
      })
    }
  }

  const filteredWebsites = websites.filter((website) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        (website.title && website.title.toLowerCase().includes(query)) ||
        (website.description && website.description.toLowerCase().includes(query)) ||
        (website.url && website.url.toLowerCase().includes(query)) ||
        (website.category && website.category.toLowerCase().includes(query)) ||
        (website.mainContent && website.mainContent.toLowerCase().includes(query))
      )
    }

    if (activeTab === "highlights") {
      // Show only recently updated websites
      const updatedAt = new Date(website.contentChangedAt || website.updatedAt || website.createdAt)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return updatedAt > threeDaysAgo
    }

    return true
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Reads.now</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshWebsites(false)}
            disabled={isRefreshing || websites.length === 0}
          >
            <RefreshCw className={`h-6 w-6 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-6 w-6 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      <div className="mb-6 w-full">
        <Input
          placeholder="Search websites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading your websites...</div>
      ) : filteredWebsites.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "No websites match your search" : "You haven't added any websites yet. Add your first one!"}
        </div>
      ) : (
        <div className="space-y-8 max-h-[calc(100vh-220px)] overflow-y-auto pb-20">
          {filteredWebsites.map((website) => (
            <WebsiteItem
              key={website.itemId}
              website={website}
              onDelete={() => handleDelete(website.itemId)}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <AddWebsiteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onWebsiteAdded={() => {
          setIsAddDialogOpen(false)
          // Force refresh the database to get the latest items
          if (userbase) {
            initDatabase()
          }
        }}
      />

      <div className="fixed bottom-4 right-4 flex items-center space-x-2">
        <div className="text-xs text-muted-foreground">{autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="rounded-full h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${autoRefresh ? "text-green-500" : "text-muted-foreground"}`} />
          <span className="sr-only">{autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}</span>
        </Button>
      </div>
    </div>
  )
}
