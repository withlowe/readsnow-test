/**
 * Fetches a website and extracts basic metadata to check for updates
 */
export async function checkWebsiteForUpdates(url: string) {
  try {
    // Add a cache-busting parameter to ensure we get fresh content
    const cacheBuster = `_cb=${Date.now()}`
    const urlWithCacheBuster = url.includes("?") ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`

    const response = await fetch(`/api/check-website?url=${encodeURIComponent(urlWithCacheBuster)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to check website")
    }

    return await response.json()
  } catch (error) {
    console.error("Error checking website:", error)
    return null
  }
}

/**
 * Compares current website data with new data to detect changes
 */
export function hasWebsiteChanged(
  currentData: { title: string; description?: string; mainContent?: string },
  newData: { title: string; description?: string; mainContent?: string },
): boolean {
  if (!currentData || !newData) return false

  // Compare title
  if (currentData.title !== newData.title) return true

  // Compare description if both exist
  if (currentData.description && newData.description && currentData.description !== newData.description) return true

  // Compare main content if both exist
  if (
    currentData.mainContent &&
    newData.mainContent &&
    currentData.mainContent.substring(0, 100) !== newData.mainContent.substring(0, 100)
  )
    return true

  return false
}

/**
 * Determines if a URL is an RSS feed
 */
export function isRssFeed(url: string): boolean {
  return url.includes(".xml") || url.includes("/rss") || url.includes("/feed") || url.includes("/atom")
}
