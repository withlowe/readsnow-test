"use client"

import type React from "react"

import { useState } from "react"
import { useUserbase } from "@/components/userbase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Rss } from "lucide-react"
import { checkWebsiteForUpdates, isRssFeed } from "@/utils/website-checker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AddWebsiteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWebsiteAdded: () => void
}

export function AddWebsiteDialog({ open, onOpenChange, onWebsiteAdded }: AddWebsiteDialogProps) {
  const { userbase } = useUserbase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userbase) return

    // Basic URL validation
    let formattedUrl = url
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`
    }

    setIsLoading(true)
    try {
      // Fetch website details
      const websiteData = await checkWebsiteForUpdates(formattedUrl)

      if (!websiteData) {
        throw new Error("Could not fetch website details")
      }

      // Get hostname for default title if needed
      let hostname
      try {
        hostname = new URL(formattedUrl).hostname
      } catch (e) {
        hostname = formattedUrl
      }

      // Prepare feed items with limited size
      const feedItems = websiteData.feedItems
        ? websiteData.feedItems.slice(0, 3).map((item) => ({
            title: item.title.substring(0, 100),
            description: item.description ? item.description.substring(0, 100) : "",
            content: item.content ? item.content.substring(0, 100) : "",
            pubDate: item.pubDate,
          }))
        : []

      // Limit content size to avoid 10KB limit
      const title = websiteData.title ? websiteData.title.substring(0, 100) : hostname
      const description = websiteData.description ? websiteData.description.substring(0, 200) : ""
      const mainContent = websiteData.mainContent ? websiteData.mainContent.substring(0, 1000) : ""
      const contentSnapshot = (title + " " + description).substring(0, 500)
      const now = new Date().toISOString()

      await userbase.insertItem({
        databaseName: "websites",
        item: {
          url: formattedUrl,
          title,
          description,
          category: "Uncategorized",
          createdAt: now,
          updatedAt: now,
          contentChangedAt: now, // Set content change timestamp
          contentChanged: true, // Mark as having changed content
          lastChecked: now,
          contentSnapshot,
          mainContent,
          isRssFeed: websiteData.isRssFeed || isRssFeed(formattedUrl),
          feedItems,
        },
      })

      toast({
        title: websiteData.isRssFeed ? "RSS Feed added" : "Website added",
        description: `Your ${websiteData.isRssFeed ? "RSS feed" : "website"} has been added to your feed`,
      })

      // Reset form
      setUrl("")

      // Notify parent component
      onWebsiteAdded()

      // Close the dialog
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding website",
        description: error.message || "Something went wrong",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Website or RSS Feed</DialogTitle>
          <DialogDescription>Enter the URL of the website or RSS feed you want to add to your feed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="text"
                placeholder="example.com or example.com/feed"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {isRssFeed(url) ? (
                  <span className="flex items-center">
                    <Rss className="h-3 w-3 mr-1" />
                    RSS feed detected. Feed items will be automatically fetched.
                  </span>
                ) : (
                  "Title, description, and content will be automatically fetched"
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Feed"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
