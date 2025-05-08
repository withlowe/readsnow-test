"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const BookmarksPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      fetchBookmarks(session.user.email)
    }
  }, [session])

  const fetchBookmarks = async (email) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookmarks?email=${email}`)
      if (response.ok) {
        const data = await response.json()
        setBookmarks(data)
      } else {
        toast.error("Failed to fetch bookmarks")
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
      toast.error("Error fetching bookmarks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBookmark = async (articleId) => {
    try {
      const response = await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          articleId: articleId,
        }),
      })

      if (response.ok) {
        toast.success("Bookmark deleted successfully!")
        fetchBookmarks(session.user.email) // Refresh bookmarks
      } else {
        toast.error("Failed to delete bookmark")
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error)
      toast.error("Error deleting bookmark")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <Separator className="mb-4" />
        <ul>
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="mb-4">
              <Skeleton className="h-24 w-full" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Subscribed</h1>
        </div>
      </div>
      <Separator className="mb-4" />
      <ul>
        {bookmarks.map((bookmark) => (
          <li key={bookmark.articleId} className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {bookmark.title}
                </a>
                <p className="text-sm text-gray-500">{new Date(bookmark.createdAt).toLocaleDateString()}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger>
                  <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700">Delete</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the bookmark from your subscribed list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteBookmark(bookmark.articleId)}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BookmarksPage
