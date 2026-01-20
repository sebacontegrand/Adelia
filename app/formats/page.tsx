"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Monitor, Smartphone, Video } from "lucide-react"

type FormatType = "desktop" | "mobile" | "video" | null

const formatData = {
  desktop: [
    {
      id: 1,
      title: "Leaderboard Banner",
      size: "728x90",
      image: "/desktop-leaderboard-banner-ad.jpg",
    },
    {
      id: 2,
      title: "Medium Rectangle",
      size: "300x250",
      image: "/desktop-medium-rectangle-ad.jpg",
    },
    {
      id: 3,
      title: "Wide Skyscraper",
      size: "160x600",
      image: "/desktop-wide-skyscraper-ad.jpg",
    },
    {
      id: 4,
      title: "Large Rectangle",
      size: "336x280",
      image: "/desktop-large-rectangle-ad.jpg",
    },
    {
      id: 5,
      title: "Billboard",
      size: "970x250",
      image: "/desktop-billboard-ad.jpg",
    },
    {
      id: 6,
      title: "Half Page",
      size: "300x600",
      image: "/desktop-half-page-ad.jpg",
    },
  ],
  mobile: [
    {
      id: 1,
      title: "Mobile Banner",
      size: "320x50",
      image: "/mobile-banner-ad.jpg",
    },
    {
      id: 2,
      title: "Mobile Leaderboard",
      size: "320x100",
      image: "/mobile-leaderboard-ad.jpg",
    },
    {
      id: 3,
      title: "Mobile Medium Rectangle",
      size: "300x250",
      image: "/mobile-medium-rectangle-ad.jpg",
    },
    {
      id: 4,
      title: "Mobile Large Banner",
      size: "320x100",
      image: "/mobile-large-banner-ad.jpg",
    },
    {
      id: 5,
      title: "Mobile Full Screen",
      size: "320x480",
      image: "/mobile-full-screen-ad.jpg",
    },
    {
      id: 6,
      title: "Mobile Interstitial",
      size: "320x568",
      image: "/mobile-interstitial-ad.jpg",
    },
  ],
  video: [
    {
      id: 1,
      title: "Pre-Roll Video",
      size: "1920x1080",
      image: "/video-pre-roll-ad-thumbnail.jpg",
    },
    {
      id: 2,
      title: "Mid-Roll Video",
      size: "1280x720",
      image: "/video-mid-roll-ad-thumbnail.jpg",
    },
    {
      id: 3,
      title: "Vertical Video",
      size: "1080x1920",
      image: "/vertical-video-ad-thumbnail.jpg",
    },
    {
      id: 4,
      title: "Square Video",
      size: "1080x1080",
      image: "/placeholder.svg?height=1080&width=1080",
    },
    {
      id: 5,
      title: "Bumper Ad",
      size: "1920x1080",
      image: "/placeholder.svg?height=1080&width=1920",
    },
    {
      id: 6,
      title: "Outstream Video",
      size: "640x480",
      image: "/placeholder.svg?height=480&width=640",
    },
  ],
}

export default function FormatsPage() {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>("desktop")

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance">Choose Your Ad Format</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-balance">
            Select from our comprehensive gallery of ad formats optimized for Desktop, Mobile, or Video platforms.
          </p>
        </div>

        {/* Format Selection Buttons */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            variant={selectedFormat === "desktop" ? "default" : "outline"}
            onClick={() => setSelectedFormat("desktop")}
            className="gap-2"
          >
            <Monitor className="h-5 w-5" />
            Desktop
          </Button>
          <Button
            size="lg"
            variant={selectedFormat === "mobile" ? "default" : "outline"}
            onClick={() => setSelectedFormat("mobile")}
            className="gap-2"
          >
            <Smartphone className="h-5 w-5" />
            Mobile
          </Button>
          <Button
            size="lg"
            variant={selectedFormat === "video" ? "default" : "outline"}
            onClick={() => setSelectedFormat("video")}
            className="gap-2"
          >
            <Video className="h-5 w-5" />
            Video
          </Button>
        </div>

        {/* Gallery Display */}
        {selectedFormat ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formatData[selectedFormat].map((item) => (
              <Card key={item.id} className="overflow-hidden border-border bg-card transition-all hover:shadow-lg">
                <div className="aspect-video w-full overflow-hidden bg-secondary">
                  <img src={item.image || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.size} pixels</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Select a format above to view available ad sizes</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
