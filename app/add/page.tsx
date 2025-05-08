"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUserbase } from "@/components/userbase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddFromExtension() {
  const { userbase, user, loading } = useUserbase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    if (searchParams) {
      const urlParam = searchParams.get("url")
      const titleParam = searchParams.get("title")

      if (urlParam) setUrl(urlParam)
      if (titleParam) setTitle(titleParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userbase || !user) return

    setIsLoading(true)
    try {
      await userbase.insertItem({
        databaseName: "websites",
        item: {
          url,
          title: title || new URL(url).hostname,
          description,
          category: category || "Uncategorized",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })

      toast({
        title: "Website added",
        description: "Your website has been added to your feed",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding website",
        description: error.message || "Something went wrong",
      })
      setIsLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Add Website from Browser</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                type="text"
                placeholder="Work, Personal, Shopping, etc."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add Website"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
