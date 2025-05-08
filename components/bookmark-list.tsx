"use client"

import { useState } from "react"
import { WebsiteItem } from "@/components/website-item"
import { Input } from "@/components/ui/input"

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
  isRssFeed?: boolean
  feedItems?: any[]
}

type BookmarkListProps = {
  websites: Website[]
  onDelete: (itemId: string) => void
  onUpdate: (itemId: string, updates: any) => void
}

export function BookmarkList({ websites, onDelete, onUpdate }: BookmarkListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWebsites = websites.filter((website) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      (website.title && website.title.toLowerCase().includes(query)) ||
      (website.url && website.url.toLowerCase().includes(query)) ||
      (website.category && website.category.toLowerCase().includes(query))
    )
  })

  return (
    <div className="w-full">
      <Input
        placeholder="Search subscribed sites..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />

      <div className="max-h-[calc(100vh-220px)] overflow-y-auto w-full">
        {filteredWebsites.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No subscribed sites found</p>
        ) : (
          <div className="divide-y w-full">
            {filteredWebsites.map((website) => (
              <WebsiteItem
                key={website.itemId}
                website={website}
                onDelete={() => onDelete(website.itemId)}
                onUpdate={onUpdate}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
