"use client"

import { useState } from "react"
import { useUserbase } from "@/components/userbase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Bug } from "lucide-react"

export function DebugPanel() {
  const { userbase, user, loading, error } = useUserbase()
  const [isOpen, setIsOpen] = useState(false)

  const appId = process.env.NEXT_PUBLIC_USERBASE_APP_ID || "Not set"
  const userbaseLoaded = typeof window !== "undefined" && !!window.userbase
  const userbaseInitialized = !!userbase

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-80">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            {isOpen ? "Hide Debug Info" : "Show Debug Info"}
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>Authentication and environment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>App ID:</strong> {appId.substring(0, 5)}...
                {appId.length > 10 ? appId.substring(appId.length - 5) : ""}
              </div>
              <div>
                <strong>Userbase Script:</strong> {userbaseLoaded ? "Loaded" : "Not Loaded"}
              </div>
              <div>
                <strong>Userbase Initialized:</strong> {userbaseInitialized ? "Yes" : "No"}
              </div>
              <div>
                <strong>Loading State:</strong> {loading ? "Loading" : "Complete"}
              </div>
              <div>
                <strong>User Authenticated:</strong> {user ? "Yes" : "No"}
              </div>
              {user && (
                <div>
                  <strong>Username:</strong> {user.username}
                </div>
              )}
              {error && (
                <div className="text-red-500">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  console.log({
                    appId,
                    userbaseLoaded,
                    userbaseInitialized,
                    loading,
                    user,
                    error,
                    window: typeof window !== "undefined" ? !!window.userbase : false,
                  })
                }}
              >
                Log Details to Console
              </Button>
            </CardFooter>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
