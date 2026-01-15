"use client"

import type { ComponentType } from "react"

import type { AdTypeOption } from "@/components/ad-type-selector"
import { PushExpandableBuilder } from "@/components/ad-builder/builders/push-expandable-builder"
import { Puzzle300Builder } from "@/components/ad-builder/builders/puzzle-300-builder"

export type AdBuilderEntry = AdTypeOption & {
  Builder?: ComponentType
}

export const adBuilderRegistry: AdBuilderEntry[] = [
  {
    id: "push-expandable",
    title: "Push Expandable",
    description: "Carga 2 creatividades y genera PNGs recortados + ZIP con HTML/manifest.",
    dimensions: "970x90, 970x250",
    status: "live",
    Builder: PushExpandableBuilder,
  },
  {
    id: "puzzle-300",
    title: "Puzzle 300x250",
    description: "Puzzle interactivo con logo, textos editables y background.",
    dimensions: "300x250",
    status: "live",
    Builder: Puzzle300Builder,
  },
  {
    id: "GameAd",
    title: "GameAd",
    description: "Exporta creatividades estaticas con nombres y ZIP automaticos.",
    dimensions: "300x250",
    status: "live",
  },
  {
    id: "leaderboard-728",
    title: "Leaderboard 728x90",
    description: "Builder rapido para banners estaticos con variantes.",
    dimensions: "728x90",
    status: "coming",
  },
  {
    id: "mobile-320",
    title: "Mobile 320x100",
    description: "Recortes y empaquetado optimizados para mobile.",
    dimensions: "320x100",
    status: "coming",
  },
]
