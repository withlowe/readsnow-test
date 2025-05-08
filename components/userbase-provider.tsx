"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import Script from "next/script"

type UserbaseContextType = {
  userbase: any
  user: any
  loading: boolean
  login?: (username: string, password: string) => Promise<any>
  signup?: (username: string, password: string) => Promise<any>
  logout?: () => Promise<void>
}

const UserbaseContext = createContext<UserbaseContextType>({
  userbase: null,
  user: null,
  loading: true,
  login: undefined,
  signup: undefined,
  logout: undefined,
})

export function UserbaseProvider({ children }: { children: React.ReactNode }) {
  const [userbase, setUserbase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (window.userbase) {
      initUserbase(window.userbase)
    }
  }, [])

  const initUserbase = async (userbaseInstance: any) => {
    setUserbase(userbaseInstance)

    try {
      const session = await userbaseInstance.init({
        appId: process.env.NEXT_PUBLIC_USERBASE_APP_ID,
      })

      if (session.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error("Error initializing userbase:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    if (!userbase) return null

    const session = await userbase.signIn({
      username,
      password,
      rememberMe: "local",
    })

    setUser(session.user)
    return session.user
  }

  const signup = async (username: string, password: string) => {
    if (!userbase) return null

    const session = await userbase.signUp({
      username,
      password,
      rememberMe: "local",
    })

    setUser(session.user)
    return session.user
  }

  const logout = async () => {
    if (!userbase) return

    await userbase.signOut()
    setUser(null)
  }

  return (
    <UserbaseContext.Provider value={{ userbase, user, loading, login, signup, logout }}>
      <Script
        src="https://sdk.userbase.com/2/userbase.js"
        onLoad={(e) => {
          if (window.userbase && !userbase) {
            initUserbase(window.userbase)
          }
        }}
      />
      {children}
    </UserbaseContext.Provider>
  )
}

export const useUserbase = () => useContext(UserbaseContext)
