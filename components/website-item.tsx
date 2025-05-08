"use client"

import type React from "react"
import { Rss } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type FeedItem = {
  title: string
  description?: string
  content?: string
  pubDate?: string
}

type WebsiteItemProps = {
  website: {
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
    contentChanged?: boolean
    contentChangedAt?: string
    isRssFeed?: boolean
    feedItems?: FeedItem[]
  }
  onDelete: () => void
  onUpdate: (itemId: string, updates: any) => void
  compact?: boolean
}

export function WebsiteItem({ website, onDelete, onUpdate, compact = false }: WebsiteItemProps) {
  const hostname = (() => {
    try {
      return new URL(website.url).hostname.replace(/^www\./, "")
    } catch (e) {
      return website.url
    }
  })()

  // Extract content differences
  const getContentDifference = () => {
    if (!website.previousSnapshot || !website.contentSnapshot) {
      return website.mainContent || ""
    }

    // Simple diff algorithm to find new content
    const oldWords = website.previousSnapshot.split(/\s+/).filter(Boolean)
    const newWords = website.contentSnapshot.split(/\s+/).filter(Boolean)

    // Find words that are in the new snapshot but not in the old one
    const oldWordsSet = new Set(oldWords)
    const newContent = newWords.filter((word) => !oldWordsSet.has(word)).join(" ")

    if (newContent) {
      return newContent
    }

    // If no clear difference is found, return the main content
    return website.mainContent || ""
  }

  // Get the latest post title from RSS feed
  const getLatestPostTitle = () => {
    if (website.feedItems && website.feedItems.length > 0) {
      return website.feedItems[0].title
    }
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) {
      e.stopPropagation()
      return
    }

    // Ensure the URL is properly formatted
    let url = website.url || ""

    // Add https:// if missing
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`
    }

    // Only navigate if we have a valid URL
    if (url) {
      // Open in a new tab
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  // If this is a compact view (for bookmarks page), render a simplified version
  if (compact) {
    return (
      <div
        className="py-3 flex items-center justify-between border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0 mr-2 max-w-[calc(100%-40px)]">
          <div className="flex items-center overflow-hidden">
            {website.isRssFeed && <Rss className="h-5 w-5 mr-1 flex-shrink-0 text-orange-500" />}
            <span className="font-medium truncate text-sm">{website.title}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground truncate">{hostname}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex-shrink-0 ml-auto"
          aria-label="Delete"
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    )
  }

  const latestPostTitle = getLatestPostTitle()

  return (
    <article
      className="border-b pb-6 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded-md transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center text-sm font-mono text-muted-foreground mb-2">
        <span className="font-medium text-foreground flex items-center">
          {website.isRssFeed && <Rss className="h-5 w-5 mr-1 text-orange-500" />}
          {hostname}
        </span>
      </div>

      <h2 className="text-xl font-semibold mb-2 group-hover:underline">{website.title}</h2>

      {website.isRssFeed && latestPostTitle ? (
        <div className="mt-3">
          <h3 className="font-bold text-lg">Latest: {latestPostTitle}</h3>
          {website.feedItems && website.feedItems.length > 1 && (
            <div className="space-y-2 mt-2">
              {website.feedItems.slice(1, 3).map((item, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-3">
                  <p className="font-medium">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>{getContentDifference()}</p>
        </div>
      )}
    </article>
  )
}
