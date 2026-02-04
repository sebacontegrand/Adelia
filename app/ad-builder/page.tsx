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
import { type AdRecord } from "@/firebase/firestore"
import { Plus, LayoutGrid, Search } from "lucide-react"
import { useLanguage } from "@/app/context/language-context"

export default function AdBuilderPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  // State
  const [viewMode, setViewMode] = useState<"create" | "saved" | "lookup">("create")
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
          </div>

          <h1 className="mb-3 text-4xl font-bold">{t("builder.title")}</h1>
          {viewMode === "create" && selectedAdTypeEntry?.helperText ? (
            <div className="mx-auto max-w-6xl">
              <p
                className="text-emerald-400"
                dangerouslySetInnerHTML={{ __html: selectedAdTypeEntry.helperText }}
              />
            </div>
          ) : null}
        </div>

        {viewMode === "saved" ? (
          <SavedAdsList userId={session?.user?.email || ""} onSelectAd={handleLoadAd} />
        ) : viewMode === "lookup" ? (
          <AdLookup onSelectTemplate={handleSelectTemplate} />
        ) : (
          <>
            <div className="mb-12 space-y-6">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold">
                  {initialData ? t("builder.editing_saved") : t("builder.choose_type")}
                </h2>
                {!initialData && (
                  <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                    {t("builder.available_formats")}
                  </p>
                )}
              </div>
              <AdTypeSelector options={adBuilderRegistry} selectedId={selectedAdType} onSelect={(id) => { setSelectedAdType(id); setInitialData(undefined); }} />
            </div>

            {!selectedAdType ? (
              // No selection state
              <div className="mx-auto max-w-2xl text-center p-8 text-muted-foreground">
                <p>{t("builder.select_format_prompt")}</p>
              </div>
            ) : BuilderComponent ? (
              <BuilderComponent key={`${selectedAdType}-${(initialData as any)?.id || "new"}`} initialData={initialData} />
            ) : (
              <Card className="border-border bg-card p-8">
                <h3 className="mb-2 text-xl font-semibold">{t("builder.coming_soon")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("builder.coming_soon_desc")}
                </p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
