"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"

import { AdTypeSelector } from "@/components/ad-type-selector"
import { adBuilderRegistry } from "@/components/ad-builder/registry"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SavedAdsList } from "@/components/ad-builder/saved-ads-list"
import { AdLookup } from "@/components/ad-builder/ad-lookup"
import { cn } from "@/lib/utils"
import { type AdRecord } from "@/firebase/firestore"
import { Plus, LayoutGrid, Search, Video } from "lucide-react"
import { VideoCreator } from "@/components/ad-builder/video-creator"
import { useLanguage } from "@/app/context/language-context"

export default function AdBuilderPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  // State
  const [viewMode, setViewMode] = useState<"create" | "saved" | "lookup" | "video">("create")
  // We keep track of "initialData" to hydrate the builder if editing/viewing a saved ad
  const [initialData, setInitialData] = useState<AdRecord | undefined>(undefined)

  // Builder selection
  const [selectedAdType, setSelectedAdType] = useState("")
  const selectedAdTypeEntry = adBuilderRegistry.find((option) => option.id === selectedAdType)
  const BuilderComponent = selectedAdTypeEntry?.Builder

  // Handlers
  const handleCreateNew = () => {
    setInitialData(undefined)
    setViewMode("create")
    setSelectedAdType("")
  }

  const handleLoadAd = (ad: AdRecord & { id: string }) => {
    // 1. Set type
    // We assume ad.type matches one of our registry IDs. If not, fallback?
    const entry = adBuilderRegistry.find((r) => r.id === ad.type)
    if (entry) {
      setSelectedAdType(ad.type)
    }
    // 2. Set data
    setInitialData(ad)
    // 3. Switch view
    setViewMode("create")
    // 4. Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSignIn = () => {
    signIn("google")
  }

  const handleSelectTemplate = (adType: string, data?: any) => {
    setSelectedAdType(adType)
    setInitialData(data)
    setViewMode("create")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-2xl border-border bg-card p-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t("builder.require_login_title")}</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("builder.require_login_desc")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                onClick={handleSignIn}
              >
                {t("builder.go_to_login")}
              </button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar onSignOut={handleSignOut} logoAction="signout" />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-6 gap-4">
            <Button
              variant={viewMode === "create" ? "default" : "outline"}
              onClick={handleCreateNew}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> {t("builder.create_new")}
            </Button>
            <Button
              variant={viewMode === "saved" ? "default" : "outline"}
              onClick={() => { setViewMode("saved"); setInitialData(undefined); }}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> {t("builder.saved_ads")}
            </Button>
            <Button
              variant={viewMode === "lookup" ? "default" : "outline"}
              onClick={() => { setViewMode("lookup"); setInitialData(undefined); }}
              className="gap-2"
            >
              <Search className="h-4 w-4" /> {t("builder.lookup") || "Lookup"}
            </Button>
            <Button
              variant={viewMode === "video" ? "default" : "outline"}
              onClick={() => { setViewMode("video"); setInitialData(undefined); }}
              className="gap-2"
            >
              <Video className="h-4 w-4" /> {t("builder.video_creator") || "Video Creator"}
            </Button>
          </div>

          <h1 className="mb-3 text-4xl font-bold">
            {viewMode === "saved" ? t("builder.saved_ads") :
              viewMode === "lookup" ? t("builder.lookup") :
                viewMode === "video" ? (t("builder.video_creator") || "AI Video Creator") :
                  t("builder.title")}
          </h1>
          {viewMode === "create" && selectedAdTypeEntry?.helperText ? (
            <div className="mx-auto max-w-6xl">
              <p
                className="text-emerald-400 text-sm"
                dangerouslySetInnerHTML={{ __html: selectedAdTypeEntry.helperText }}
              />
            </div>
          ) : viewMode === "create" ? (
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              {t("builder.choose_type")}
            </p>
          ) : null}
        </div>

        {viewMode === "saved" ? (
          <SavedAdsList userId={session?.user?.email || ""} onSelectAd={handleLoadAd} />
        ) : viewMode === "lookup" ? (
          <AdLookup onSelectTemplate={handleSelectTemplate} />
        ) : viewMode === "video" ? (
          <VideoCreator />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* Sidebar Column - Dynamic Width with Peek Logic */}
            <aside
              className={cn(
                "transition-all duration-500 ease-in-out lg:sticky lg:top-24 z-40 group/sidebar",
                selectedAdType
                  ? "w-full lg:w-12 opacity-30 hover:opacity-100 lg:hover:w-16"
                  : "w-full lg:w-[400px]"
              )}
            >
              <Card className={cn(
                "border-border bg-card shadow-xl backdrop-blur-md bg-opacity-80 transition-all duration-500",
                selectedAdType ? "p-1 rounded-xl overflow-visible" : "p-6 rounded-3xl overflow-hidden"
              )}>
                {!selectedAdType ? (
                  <div className="mb-6 animate-in fade-in duration-500">
                    <h3 className="font-bold text-xl mb-1 tracking-tight">{t("builder.available_formats")}</h3>
                    <p className="text-xs text-muted-foreground opacity-70">Select a specialized format to start your campaign.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedAdType("")}
                      className="w-8 h-8 mb-2 hover:bg-primary/10 text-primary transition-colors"
                      title="Clear Selection"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                    <div className="w-full h-px bg-border/20 mb-2" />
                  </div>
                )}

                <div className={cn(
                  "custom-scrollbar transition-all duration-500",
                  selectedAdType ? "max-h-[80vh] py-2" : "max-h-[65vh] overflow-y-auto pr-2"
                )}>
                  <AdTypeSelector
                    variant={selectedAdType ? "compact" : "sidebar"}
                    options={adBuilderRegistry}
                    selectedId={selectedAdType}
                    onSelect={(id) => { setSelectedAdType(id); setInitialData(undefined); }}
                  />
                </div>
              </Card>
            </aside>

            {/* Main Column - Flexible Growth */}
            <div className="flex-1 w-full space-y-8 min-w-0">
              {!selectedAdType ? (
                <Card className="flex flex-col items-center justify-center p-24 text-center border-dashed border-2 border-primary/20 bg-primary/5 rounded-3xl animate-in zoom-in-95 duration-500">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">{t("builder.select_format_prompt")}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Choose one of our premium ad formats from the sidebar to begin your creative journey. Each format is optimized for high conversion and seamless distribution.
                  </p>
                </Card>
              ) : BuilderComponent ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                  <BuilderComponent key={`${selectedAdType}-${(initialData as any)?.id || "new"}`} initialData={initialData} />
                </div>
              ) : (
                <Card className="border-border bg-card p-12 text-center rounded-3xl">
                  <h3 className="mb-2 text-2xl font-semibold">{t("builder.coming_soon")}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("builder.coming_soon_desc")}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
