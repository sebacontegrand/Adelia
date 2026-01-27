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
import { type AdRecord } from "@/firebase/firestore"
import { Plus, LayoutGrid } from "lucide-react"

export default function AdBuilderPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  // State
  const [viewMode, setViewMode] = useState<"create" | "saved">("create")
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
            <h1 className="mb-2 text-3xl font-bold">Ad Builder requiere login</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Podes seguir explorando formatos, pero para generar anuncios necesitas iniciar sesion.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                onClick={handleSignIn}
              >
                Ir al login
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
              <Plus className="h-4 w-4" /> Crear Nuevo
            </Button>
            <Button
              variant={viewMode === "saved" ? "default" : "outline"}
              onClick={() => { setViewMode("saved"); setInitialData(undefined); }}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> Mis Guardados
            </Button>
          </div>

          <h1 className="mb-3 text-4xl font-bold">Adelia Builder</h1>
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
        ) : (
          <>
            <div className="mb-12 space-y-6">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold">
                  {initialData ? "Editando anuncio guardado" : "Elegi el tipo de anuncio"}
                </h2>
                {!initialData && (
                  <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                    Disponible en este momento: <strong>Push Expandable</strong>, <strong>Puzzle 300x250</strong> y{" "}
                    <strong>ColorAd 300x250</strong> y <strong>Podcastwith 300x250</strong>. Pronto mas formatos!
                  </p>
                )}
              </div>
              <AdTypeSelector options={adBuilderRegistry} selectedId={selectedAdType} onSelect={(id) => { setSelectedAdType(id); setInitialData(undefined); }} />
            </div>

            {!selectedAdType ? (
              // No selection state
              <div className="mx-auto max-w-2xl text-center p-8 text-muted-foreground">
                <p>Selecciona un formato de la lista para comenzar a crear tu anuncio.</p>
              </div>
            ) : BuilderComponent ? (
              <BuilderComponent key={`${selectedAdType}-${(initialData as any)?.id || "new"}`} initialData={initialData} />
            ) : (
              <Card className="border-border bg-card p-8">
                <h3 className="mb-2 text-xl font-semibold">Builder en camino</h3>
                <p className="text-sm text-muted-foreground">
                  Todavia no esta disponible el builder para <strong>{selectedAdTypeEntry?.title ?? "este formato"}</strong>. Elegi el
                  formato Push Expandable para continuar.
                </p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
