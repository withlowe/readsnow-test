import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebsiteFeedBot/1.0; +https://yourwebsite.com)",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    const isXml =
      contentType.includes("xml") ||
      url.includes(".xml") ||
      url.includes("/rss") ||
      url.includes("/feed") ||
      url.includes("/atom")

    const text = await response.text()

    if (isXml) {
      // Handle RSS/XML feed
      const $ = cheerio.load(text, { xmlMode: true })

      // Try to get feed title and description
      const title = $("channel > title").text() || $("feed > title").text() || ""
      const description = $("channel > description").text() || $("feed > subtitle").text() || ""

      // Get the latest items/entries
      const items = []

      // RSS format
      $("item")
        .slice(0, 3) // Limit to 3 items to reduce size
        .each(function () {
          const itemTitle = $(this).find("title").text()
          // Limit description and content length
          const itemDescription = $(this).find("description").text().substring(0, 200)
          const itemContent = ($(this).find("content\\:encoded").text() || $(this).find("content").text()).substring(
            0,
            200,
          )
          const pubDate = $(this).find("pubDate").text() || $(this).find("published").text()

          items.push({
            title: itemTitle,
            description: itemDescription,
            content: itemContent,
            pubDate,
          })
        })

      // Atom format
      $("entry")
        .slice(0, 3) // Limit to 3 items to reduce size
        .each(function () {
          const itemTitle = $(this).find("title").text()
          // Limit description and content length
          const itemDescription = $(this).find("summary").text().substring(0, 200)
          const itemContent = $(this).find("content").text().substring(0, 200)
          const pubDate = $(this).find("published").text() || $(this).find("updated").text()

          items.push({
            title: itemTitle,
            description: itemDescription,
            content: itemContent,
            pubDate,
          })
        })

      // Combine the latest items into main content (limited)
      const mainContent = items
        .map((item) => `${item.title}\n${(item.description || item.content || "").substring(0, 100)}`)
        .join("\n\n")
        .substring(0, 500)

      return NextResponse.json({
        title: title.substring(0, 100),
        description: description.substring(0, 200),
        mainContent: mainContent.substring(0, 500),
        isRssFeed: true,
        feedItems: items,
        checkedAt: new Date().toISOString(),
      })
    } else {
      // Handle regular HTML website
      const $ = cheerio.load(text)

      // Extract basic metadata
      const title = $("title").text().trim().substring(0, 100) || ""
      const description = (
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        ""
      ).substring(0, 200)

      // Try to get main content
      let mainContent = ""

      // Try different selectors that might contain the main content
      const contentSelectors = [
        "article",
        "main",
        ".content",
        "#content",
        ".post-content",
        ".entry-content",
        ".article-content",
        ".post",
        "#main-content",
      ]

      for (const selector of contentSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          // Remove scripts, styles, and comments
          element.find("script, style, noscript, iframe").remove()

          // Get text content
          const text = element.text().replace(/\s+/g, " ").trim()
          if (text.length > mainContent.length) {
            mainContent = text
          }
        }
      }

      // If no content found with selectors, get some text from the page
      if (!mainContent || mainContent.length < 100) {
        // Get all paragraphs
        const paragraphs = $("p")
          .filter(function () {
            const text = $(this).text().trim()
            return text.length > 40 // Only paragraphs with substantial content
          })
          .map(function () {
            return $(this).text().trim()
          })
          .get()
          .join("\n\n")
          .substring(0, 1000)

        if (paragraphs.length > mainContent.length) {
          mainContent = paragraphs
        }
      }

      // Limit content length
      mainContent = mainContent.substring(0, 1000)

      // Get last modified date if available
      const lastModified = response.headers.get("last-modified") || null

      return NextResponse.json({
        title,
        description,
        mainContent,
        isRssFeed: false,
        lastModified,
        checkedAt: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error checking website:", error)
    return NextResponse.json({ error: "Failed to check website" }, { status: 500 })
  }
}
