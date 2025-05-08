"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { ContentFeed } from "@/components/content-feed"
import { Sidebar } from "@/components/sidebar"
import { useUserbase } from "@/components/userbase-provider"
import { DebugPanel } from "@/components/debug-panel"
import { EnvDebug } from "@/components/env-debug"

export default function Home() {
  const { user, loading } = useUserbase()
  const [isClient, setIsClient] = useState(false)
  const searchParams = useSearchParams()
  const showSearch = searchParams?.get("search") === "true"
  const showDebug = searchParams?.get("debug") === "true" || process.env.NODE_ENV === "development"

  useEffect(() => {
    setIsClient(true)

    // Focus search input if search param is true
    if (showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)
    }
  }, [showSearch])

  if (!isClient || loading) {
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
        {!user ? (
          <div className="max-w-md mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-center mb-8">Reads.now</h1>
            <AuthForm />
          </div>
        ) : (
          <ContentFeed />
        )}
      </main>
      {showDebug && <DebugPanel />}
      <EnvDebug />
    </div>
  )
}
