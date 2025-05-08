"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Chrome, ChromeIcon as Firefox } from "lucide-react"

export function BrowserExtension() {
  const [activeTab, setActiveTab] = useState("chrome")

  const extensionCode = `
// background.js
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    chrome.tabs.create({
      url: "https://your-website-feed-app.vercel.app/add?url=" + 
           encodeURIComponent(currentTab.url) + 
           "&title=" + 
           encodeURIComponent(currentTab.title)
    });
  });
});
  `.trim()

  const manifestCode = `
{
  "manifest_version": 3,
  "name": "Website Feed",
  "version": "1.0",
  "description": "Add websites to your personal feed",
  "permissions": ["activeTab"],
  "action": {
    "default_title": "Add to Website Feed"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
  `.trim()

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Browser Extension</CardTitle>
        <CardDescription>Add websites to your feed directly from your browser with our extension</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chrome" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chrome">
              <Chrome className="h-4 w-4 mr-2" />
              Chrome
            </TabsTrigger>
            <TabsTrigger value="firefox">
              <Firefox className="h-4 w-4 mr-2" />
              Firefox
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chrome" className="space-y-4">
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">1. Create a new directory for your extension</h4>
              <h4 className="text-sm font-medium mb-2">2. Create a file named manifest.json:</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                <code>{manifestCode}</code>
              </pre>
              <h4 className="text-sm font-medium my-2">3. Create a file named background.js:</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                <code>{extensionCode}</code>
              </pre>
              <h4 className="text-sm font-medium my-2">4. Add icon files (icon16.png, icon48.png, icon128.png)</h4>
              <h4 className="text-sm font-medium my-2">
                5. Go to chrome://extensions/, enable Developer mode, and click "Load unpacked"
              </h4>
            </div>
          </TabsContent>
          <TabsContent value="firefox" className="space-y-4">
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">1. Create a new directory for your extension</h4>
              <h4 className="text-sm font-medium mb-2">2. Create the same files as for Chrome</h4>
              <h4 className="text-sm font-medium mb-2">
                3. Go to about:debugging#/runtime/this-firefox, click "Load Temporary Add-on", and select any file in
                your extension directory
              </h4>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Extension Files
        </Button>
      </CardFooter>
    </Card>
  )
}
