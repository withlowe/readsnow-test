"use client"

import { useState } from "react"
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
  const [isExpanded, setIsExpanded] = useState(false)

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

  // If this is a compact view (for bookmarks page), render a simplified version
  if (compact) {
    return (
      <div className="py-2 flex items-center justify-between border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {website.isRssFeed && <Rss className="h-3 w-3 mr-1 text-orange-500" />}
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline truncate"
            >
              {website.title}
            </a>
          </div>
          <div className="text-xs text-muted-foreground truncate">{hostname}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} className="ml-2">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    )
  }

  return (
    <article className="border-b pb-6 group">
      <a href={website.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground flex items-center">
            {website.isRssFeed && <Rss className="h-3 w-3 mr-1 text-orange-500" />}
            {hostname}
          </span>
        </div>

        <h2 className="text-xl font-semibold mb-2 group-hover:underline">{website.title}</h2>

        {website.isRssFeed && website.feedItems && website.feedItems.length > 0 ? (
          <div className="space-y-3 mt-3">
            {website.feedItems.slice(0, isExpanded ? undefined : 3).map((item, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-3">
                <h3 className="font-medium">{item.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className={`prose prose-sm dark:prose-invert max-w-none ${!isExpanded && "line-clamp-6"}`}>
            <p>{getContentDifference()}</p>
          </div>
        )}

        {((website.mainContent && website.mainContent.length > 300) ||
          (website.isRssFeed && website.feedItems && website.feedItems.length > 3)) && (
          <Button
            variant="link"
            className="px-0 h-auto text-sm mt-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
      </a>
    </article>
  )
}
