"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle2 } from "lucide-react"

export default function AdBuilderPage() {
  const [formatType, setFormatType] = useState("")
  const [adSize, setAdSize] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const { toast } = useToast()

  const formatOptions = {
    desktop: [
      "728x90 - Leaderboard",
      "300x250 - Medium Rectangle",
      "160x600 - Wide Skyscraper",
      "336x280 - Large Rectangle",
      "970x250 - Billboard",
    ],
    mobile: [
      "320x50 - Mobile Banner",
      "320x100 - Mobile Leaderboard",
      "300x250 - Mobile Medium Rectangle",
      "320x480 - Mobile Full Screen",
    ],
    video: ["1920x1080 - Full HD", "1280x720 - HD", "1080x1920 - Vertical", "1080x1080 - Square"],
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formatType || !adSize || !uploadedImage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and upload an image.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Ad Created Successfully!",
      description: "Your advertisement has been generated and saved.",
    })

    // Reset form
    setFormatType("")
    setAdSize("")
    setUploadedImage(null)
    setFileName("")
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance">Ad Builder</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-balance">
            Create custom advertisements by selecting your format, size, and uploading your creative assets.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <Card className="border-border bg-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="format-type">Format Type</Label>
                <Select value={formatType} onValueChange={setFormatType}>
                  <SelectTrigger id="format-type">
                    <SelectValue placeholder="Select format type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-size">Ad Size</Label>
                <Select value={adSize} onValueChange={setAdSize} disabled={!formatType}>
                  <SelectTrigger id="ad-size">
                    <SelectValue placeholder="Select ad size" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatType &&
                      formatOptions[formatType as keyof typeof formatOptions]?.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {fileName || "Choose Image"}
                  </Button>
                </div>
                {fileName && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {fileName}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Advertisement
              </Button>
            </form>
          </Card>

          {/* Preview Section */}
          <Card className="border-border bg-card p-8">
            <h2 className="mb-6 text-2xl font-bold">Preview</h2>
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/20">
              {uploadedImage ? (
                <div className="space-y-4 text-center">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Ad preview"
                    className="mx-auto max-h-[350px] max-w-full rounded-lg object-contain"
                  />
                  {adSize && <p className="text-sm text-muted-foreground">Size: {adSize}</p>}
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Upload an image to see preview</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
