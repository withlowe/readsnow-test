"use client"

import type React from "react"

import { useState } from "react"
import { useUserbase } from "@/components/userbase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { checkWebsiteForUpdates } from "@/utils/website-checker"

export function WebsiteForm({ onWebsiteAdded }: { onWebsiteAdded: () => void }) {
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

      await userbase.insertItem({
        databaseName: "websites",
        item: {
          url: formattedUrl,
          title: websiteData.title || hostname,
          description: websiteData.description || "",
          category: "Uncategorized",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          contentSnapshot: websiteData.title + " " + websiteData.description,
        },
      })

      toast({
        title: "Website added",
        description: "Your website has been added to your feed",
      })

      // Reset form
      setUrl("")

      // Notify parent component
      onWebsiteAdded()
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
    <Card>
      <CardHeader>
        <CardTitle>Add Website</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="text"
                placeholder="example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Title and description will be automatically fetched from the website
            </p>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
