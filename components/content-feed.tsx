"use client"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    if (userbase) {
      initDatabase()
    }
  }, [userbase])

  // Function to sort websites by most recent content change
  const sortWebsitesByContentChange = (sites: Website[]) => {
    return [...sites].sort((a, b) => {
      // Use contentChangedAt as the primary sort field if available
      const dateA = new Date(a.contentChangedAt || a.updatedAt || a.createdAt).getTime()
      const dateB = new Date(b.contentChangedAt || b.updatedAt || b.createdAt).getTime()
      return dateB - dateA
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

          setWebsites(sortedItems)
          setIsLoading(false)
        },
      })
    } catch (error: any) {
      console.error("Error opening database:", error)
      toast({
        variant: "destructive",
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
        description: "The website has been removed from your feed",
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
        description: "The website has been updated",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating website",
        description: error.message || "Something went wrong",
      })
    }
  }

  const refreshWebsites = async () => {
    if (!userbase || isRefreshing || websites.length === 0) return

    setIsRefreshing(true)
    toast({
      title: "Refreshing websites",
      description: "Checking for content updates...",
    })

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
                contentChangedAt: now, // Set content change timestamp
                contentChanged: true, // Mark as having changed content
                lastChecked: now,
                feedItems: feedItems,
                isRssFeed: websiteData.isRssFeed || website.isRssFeed,
              },
            })
            updatedCount++
            return { website, updated: true }
          } else {
            // Update just the lastChecked timestamp
            await userbase.updateItem({
              databaseName: "websites",
              itemId: website.itemId,
              item: {
                lastChecked: new Date().toISOString(),
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
    if (updatedCount > 0) {
      await initDatabase()
    }

    setIsRefreshing(false)

    toast({
      title: updatedCount > 0 ? "Websites refreshed" : "No updates found",
      description:
        updatedCount > 0
          ? `Found updates for ${updatedCount} website${updatedCount === 1 ? "" : "s"}`
          : "All websites are up to date",
    })
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <img src="/logo.png" alt="Reads.now" className="h-8 mr-2" />
          <h1 className="text-xl font-bold">Reads.now</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWebsites}
            disabled={isRefreshing || websites.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
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
        <div className="space-y-8">
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
    </div>
  )
}
