"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Plus, Bookmark, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUserbase } from "@/components/userbase-provider"
import { useToast } from "@/components/ui/use-toast"
import { AddWebsiteDialog } from "@/components/add-website-dialog"
import { useState } from "react"

export function Sidebar() {
  const router = useRouter()
  const { logout, user } = useUserbase()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

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

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-16 border-r bg-background flex flex-col items-center py-6">
        <div className="flex flex-col items-center space-y-6 flex-1">
          <Link href="/" className="mb-6">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/?search=true")}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add Site</span>
          </Button>

          <Link href="/bookmarks">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bookmark className="h-5 w-5" />
              <span className="sr-only">Bookmarks</span>
            </Button>
          </Link>
        </div>

        <div className="mt-auto flex flex-col items-center space-y-4">
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign Out</span>
            </Button>
          )}
        </div>
      </div>

      <AddWebsiteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onWebsiteAdded={() => {
          setIsAddDialogOpen(false)
        }}
      />
    </>
  )
}
