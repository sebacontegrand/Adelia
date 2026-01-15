"use client"

import { useState } from "react"

import { AdTypeSelector } from "@/components/ad-type-selector"
import { adBuilderRegistry } from "@/components/ad-builder/registry"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"

export default function AdBuilderPage() {
  const [selectedAdType, setSelectedAdType] = useState(adBuilderRegistry[0]?.id ?? "")
  const selectedAdTypeEntry = adBuilderRegistry.find((option) => option.id === selectedAdType)
  const BuilderComponent = selectedAdTypeEntry?.Builder

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold">Adelia Builder</h1>
          {selectedAdTypeEntry?.helperText ? (
            <div className="mx-auto max-w-6xl">
              <p
                className="text-emerald-400"
                dangerouslySetInnerHTML={{ __html: selectedAdTypeEntry.helperText }}
              />
            </div>
          ) : null}
        </div>

        <div className="mb-12 space-y-6">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold">Elegi el tipo de anuncio</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
              Disponible en este momento: <strong>Push Expandable</strong>. Pronto mas formatos!
            </p>
          </div>
          <AdTypeSelector options={adBuilderRegistry} selectedId={selectedAdType} onSelect={setSelectedAdType} />
        </div>

        {BuilderComponent ? (
          <BuilderComponent />
        ) : (
          <Card className="border-border bg-card p-8">
            <h3 className="mb-2 text-xl font-semibold">Builder en camino</h3>
            <p className="text-sm text-muted-foreground">
              Todavia no esta disponible el builder para <strong>{selectedAdTypeEntry?.title ?? "este formato"}</strong>. Elegi el
              formato Push Expandable para continuar.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
