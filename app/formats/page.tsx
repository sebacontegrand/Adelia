"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Monitor, Smartphone, Video } from "lucide-react"
import { adBuilderRegistry, FormatCategory } from "@/components/ad-builder/registry"

export default function FormatsPage() {
  const [selectedFormat, setSelectedFormat] = useState<FormatCategory | null>("desktop")

  const filteredFormats = useMemo(() => {
    if (!selectedFormat) return []
    return adBuilderRegistry.filter(format => format.category === selectedFormat)
  }, [selectedFormat])

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
          {/* Add Social logic if needed in future */}
        </div>

        {/* Gallery Display */}
        {selectedFormat ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFormats.length > 0 ? (
              filteredFormats.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border bg-card transition-all hover:shadow-lg flex flex-col">
                  <div className="aspect-video w-full overflow-hidden bg-secondary relative group">
                    <img src={item.image || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link href={`/ad-builder?format=${item.id}`}>
                        <Button variant="secondary">Create Now</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{item.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{item.description}</p>
                    <div className="text-xs text-slate-500">Dimensions: {item.dimensions}</div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No formats found for this category yet.
              </div>
            )}
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
