"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUserbase } from "@/components/userbase-provider"
import { Sidebar } from "@/components/sidebar"
import { BookmarkList } from "@/components/bookmark-list"
import { useToast } from "@/components/ui/use-toast"

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

export default function BookmarksPage() {
  const { userbase, user, loading } = useUserbase()
  const router = useRouter()
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

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
          const websites = items.map((item: any) => ({
            itemId: item.itemId,
            ...item.item,
          }))

          setWebsites(websites)
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

  if (!isClient || loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-16 ml-0 pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center mb-8">
            <h1 className="text-xl font-bold">Subscribed</h1>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading your saved sites...</div>
          ) : (
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pb-20 w-full">
              <BookmarkList websites={websites} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
