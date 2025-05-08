"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import Script from "next/script"
import { useToast } from "@/components/ui/use-toast"

type UserbaseContextType = {
  userbase: any
  user: any
  loading: boolean
  error: string | null
  login?: (username: string, password: string) => Promise<any>
  signup?: (username: string, password: string) => Promise<any>
  logout?: () => Promise<void>
}

const UserbaseContext = createContext<UserbaseContextType>({
  userbase: null,
  user: null,
  loading: true,
  error: null,
  login: undefined,
  signup: undefined,
  logout: undefined,
})

export function UserbaseProvider({ children }: { children: React.ReactNode }) {
  const [userbase, setUserbase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (window.userbase && !userbase) {
      initUserbase(window.userbase)
    }
  }, [userbase, scriptLoaded])

  const initUserbase = async (userbaseInstance: any) => {
    setUserbase(userbaseInstance)
    setError(null)

    try {
      const appId = process.env.NEXT_PUBLIC_USERBASE_APP_ID

      if (!appId) {
        throw new Error("Userbase App ID is not defined. Please check your environment variables.")
      }

      console.log("Initializing Userbase with App ID:", appId)

      const session = await userbaseInstance.init({
        appId,
      })

      console.log("Userbase initialized successfully")

      if (session.user) {
        console.log("User is already logged in")
        setUser(session.user)
      } else {
        console.log("No user session found")
      }
    } catch (error: any) {
      console.error("Error initializing userbase:", error)
      setError(error.message || "Failed to initialize Userbase")
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: `Failed to initialize Userbase: ${error.message || "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    if (!userbase) return null
    setError(null)

    try {
      console.log("Attempting to sign in user:", username)

      const session = await userbase.signIn({
        username,
        password,
        rememberMe: "local",
      })

      console.log("Sign in successful")
      setUser(session.user)
      return session.user
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to sign in")
      throw error
    }
  }

  const signup = async (username: string, password: string) => {
    if (!userbase) return null
    setError(null)

    try {
      console.log("Attempting to sign up user:", username)

      const session = await userbase.signUp({
        username,
        password,
        rememberMe: "local",
      })

      console.log("Sign up successful")
      setUser(session.user)
      return session.user
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "Failed to sign up")
      throw error
    }
  }

  const logout = async () => {
    if (!userbase) return
    setError(null)

    try {
      console.log("Attempting to sign out user")
      await userbase.signOut()
      console.log("Sign out successful")
      setUser(null)
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to sign out")
      throw error
    }
  }

  return (
    <UserbaseContext.Provider value={{ userbase, user, loading, error, login, signup, logout }}>
      <Script
        src="https://sdk.userbase.com/2/userbase.js"
        onLoad={() => {
          console.log("Userbase script loaded")
          setScriptLoaded(true)
          if (window.userbase && !userbase) {
            initUserbase(window.userbase)
          }
        }}
        onError={(e) => {
          console.error("Failed to load Userbase script:", e)
          setError("Failed to load Userbase script")
          setLoading(false)
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to load Userbase authentication service. Please try again later.",
          })
        }}
      />
      {children}
    </UserbaseContext.Provider>
  )
}

export const useUserbase = () => useContext(UserbaseContext)
