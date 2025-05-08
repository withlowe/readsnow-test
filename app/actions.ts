"use server"

import crypto from "crypto"

interface UpdateCheckResult {
  contentHash: string
  hasChanged: boolean
}

/**
 * Fetches a website and checks if its content has changed
 * @param url The URL to check
 * @param previousHash The previous content hash to compare against
 * @returns Object containing the new content hash and whether content has changed
 */
export async function checkWebsiteUpdates(url: string, previousHash: string): Promise<UpdateCheckResult> {
  try {
    // Ensure URL has a protocol
    let validUrl = url
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl
    }

    // Validate URL
    const validatedUrl = new URL(validUrl)

    // Fetch the website content
    const response = await fetch(validatedUrl.toString(), {
      headers: {
        // Some websites block requests without proper user agent
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkChecker/1.0)",
      },
      next: { revalidate: 0 }, // Disable cache to always get fresh content
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
    }

    // Get the content as text
    const content = await response.text()

    // Extract the main content to avoid false positives from dynamic elements
    const mainContent = extractMainContent(content)

    // Create a hash of the content
    const contentHash = crypto.createHash("sha256").update(mainContent).digest("hex")

    // Check if the content has changed
    const hasChanged = previousHash !== "" && previousHash !== contentHash

    return {
      contentHash,
      hasChanged,
    }
  } catch (error) {
    console.error("Error checking website updates:", error)
    throw error
  }
}

/**
 * Extracts the main content from HTML to avoid false positives from timestamps, ads, etc.
 * This is a simplified version - a production version would be more sophisticated
 */
function extractMainContent(html: string): string {
  try {
    // Remove script tags and their content
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

    // Remove style tags and their content
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

    // Remove comments
    content = content.replace(/<!--[\s\S]*?-->/g, "")

    // Remove common dynamic elements that change frequently but don't represent meaningful updates
    // This is a simplified approach - a real implementation would be more sophisticated
    content = content.replace(/<time[^>]*>.*?<\/time>/gi, "") // Remove time elements
    content = content.replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/gi, "") // Remove time strings
    content = content.replace(/\b(today|yesterday|tomorrow)\b/gi, "") // Remove relative day references

    // Remove whitespace
    content = content.replace(/\s+/g, " ").trim()

    return content
  } catch (error) {
    console.error("Error extracting main content:", error)
    return html // Fall back to the original HTML if extraction fails
  }
}
