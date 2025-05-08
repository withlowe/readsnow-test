"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserbase } from "@/components/userbase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export function AuthForm() {
  const { userbase, user, login, signup, error } = useUserbase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("signin")

  useEffect(() => {
    // Clear error when tab changes
    setAuthError(null)
  }, [activeTab])

  useEffect(() => {
    // Update local error state when provider error changes
    if (error) {
      setAuthError(error)
    }
  }, [error])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signup || !userbase) {
      setAuthError("Authentication service not available")
      return
    }

    setIsLoading(true)
    setAuthError(null)

    try {
      await signup(username, password)

      toast({
        title: "Account created",
        description: "You have successfully signed up!",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Sign up error:", error)
      setAuthError(error.message || "Something went wrong during sign up")
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message || "Something went wrong",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!login || !userbase) {
      setAuthError("Authentication service not available")
      return
    }

    setIsLoading(true)
    setAuthError(null)

    try {
      await login(username, password)

      toast({
        title: "Welcome back",
        description: "You have successfully signed in!",
      })

      router.refresh()
    } catch (error: any) {
      console.error("Sign in error:", error)
      setAuthError(error.message || "Something went wrong during sign in")
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "Something went wrong",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <CardDescription className="pt-4">Manage your website collection with a personal account</CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {!userbase && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Service Unavailable</AlertTitle>
                <AlertDescription>
                  The authentication service is currently unavailable. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-username">Username</Label>
                  <Input
                    id="signin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading || !userbase}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || !userbase}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !userbase}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading || !userbase}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || !userbase}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !userbase}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
