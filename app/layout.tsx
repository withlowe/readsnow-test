import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UserbaseProvider } from "@/components/userbase-provider"
import "./globals.css"

// Load Inter font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: "Website Feed",
  description: "Save and browse your favorite websites",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserbaseProvider>
            {children}
            <Toaster />
          </UserbaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
