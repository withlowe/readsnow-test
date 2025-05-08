"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export function EnvDebug() {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
        <AlertCircle className="h-4 w-4 mr-2" />
        {isVisible ? "Hide Debug" : "Show Debug"}
      </Button>

      {isVisible && (
        <Card className="mt-2 w-80">
          <CardHeader>
            <CardTitle>Environment Debug</CardTitle>
            <CardDescription>Environment variable information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>NEXT_PUBLIC_USERBASE_APP_ID:</strong>{" "}
              {typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_USERBASE_APP_ID
                ? "✅ Defined"
                : "❌ Not defined"}
            </div>
            <div>
              <strong>Value:</strong>{" "}
              {typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_USERBASE_APP_ID
                ? process.env.NEXT_PUBLIC_USERBASE_APP_ID.substring(0, 5) + "..."
                : "N/A"}
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                console.log({
                  env: process.env,
                  NEXT_PUBLIC_USERBASE_APP_ID: process.env.NEXT_PUBLIC_USERBASE_APP_ID,
                  window: typeof window !== "undefined" ? !!window.userbase : false,
                })
              }}
            >
              Log Details to Console
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
