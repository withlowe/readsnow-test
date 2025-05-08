"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUserbase } from "@/components/userbase-provider"
import { WebsiteForm } from "@/components/website-form"
import { WebsiteItem } from "@/components/website-item"
import { BookmarkList } from "@/components/bookmark-list"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrowserExtension } from "@/components/browser-extension"
import { checkWebsiteForUpdates } from "@/utils/website-checker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
}

export function WebsiteFeed() {
  const { userbase, user, logout } = useUserbase()
  const router = useRouter()
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("feed")

  useEffect(() => {
    if (userbase && user) {
      initDatabase()
    }
  }, [userbase, user])

  const initDatabase = async () => {
    setIsLoading(true)
    try {
      await userbase.openDatabase({
        databaseName: "websites",
        changeHandler: (items: any) => {
          // Sort by update date, newest first
          const sortedItems = [...items].sort((a, b) => {
            const dateA = new Date(b.item.updatedAt || b.item.createdAt).getTime()
            const dateB = new Date(a.item.updatedAt || a.item.createdAt).getTime()
            return dateA - dateB
          })

          const websites = sortedItems.map((item) => ({
            itemId: item.itemId,
            ...item.item,
          }))

          setWebsites(websites)

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(websites.map((site) => site.category || "Uncategorized")))
          setCategories(uniqueCategories)

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

  const handleSignOut = async () => {
    if (!logout) return

    try {
      await logout()
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "Something went wrong",
      })
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
          // Skip if checked in the last hour
          const lastChecked = website.lastChecked ? new Date(website.lastChecked) : null
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

          if (lastChecked && lastChecked > oneHourAgo) {
            return { website, updated: false }
          }

          const websiteData = await checkWebsiteForUpdates(website.url)
          if (!websiteData) return { website, updated: false }

          const newContentSnapshot = websiteData.title + " " + websiteData.description
          const hasChanged = website.contentSnapshot !== newContentSnapshot

          if (hasChanged) {
            await userbase.updateItem({
              databaseName: "websites",
              itemId: website.itemId,
              item: {
                title: websiteData.title || website.title,
                description: websiteData.description || website.description,
                previousSnapshot: website.contentSnapshot,
                contentSnapshot: newContentSnapshot,
                updatedAt: new Date().toISOString(),
                lastChecked: new Date().toISOString(),
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

    setIsRefreshing(false)

    toast({
      title: updatedCount > 0 ? "Websites refreshed" : "No updates found",
      description:
        updatedCount > 0
          ? `Found updates for ${updatedCount} website${updatedCount === 1 ? "" : "s"}`
          : "All websites are up to date",
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Welcome, {user?.username}</h2>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <WebsiteForm onWebsiteAdded={() => {}} />

      <div className="mt-8">
        <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">Latest</TabsTrigger>
            <TabsTrigger value="bookmarks">Add Bookmark</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search websites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  className="w-full h-10 px-3 py-2 border border-input rounded-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Websites</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWebsites}
                disabled={isRefreshing || websites.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Check for Updates"}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading your websites...</div>
            ) : websites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                You haven&apos;t added any websites yet. Add your first one above!
              </div>
            ) : (
              <div className="space-y-4">
                {websites
                  .filter((website) => {
                    // Filter by search query
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase()
                      return (
                        website.title.toLowerCase().includes(query) ||
                        website.description?.toLowerCase().includes(query) ||
                        website.url.toLowerCase().includes(query) ||
                        website.category.toLowerCase().includes(query)
                      )
                    }
                    return true
                  })
                  .filter((website) => {
                    // Filter by category
                    if (categoryFilter) {
                      return website.category === categoryFilter
                    }
                    return true
                  })
                  .map((website) => (
                    <WebsiteItem
                      key={website.itemId}
                      website={website}
                      onDelete={() => handleDelete(website.itemId)}
                      onUpdate={handleUpdate}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-4">
            <BookmarkList websites={websites} onDelete={handleDelete} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>

      <BrowserExtension />
    </div>
  )
}
