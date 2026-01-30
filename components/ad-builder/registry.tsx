"use client"

import type { ComponentType } from "react"

import type { AdTypeOption } from "@/components/ad-type-selector"
import { PushExpandableBuilder } from "@/components/ad-builder/builders/push-expandable-builder"
import { Puzzle300Builder } from "@/components/ad-builder/builders/puzzle-300-builder"
import { ColorAdBuilder } from "@/components/ad-builder/builders/colorad-builder"
import { PodcastwithBuilder } from "@/components/ad-builder/builders/podcastwith-builder"
import { NativeBuilder } from "@/components/ad-builder/builders/native-builder"

import { type AdRecord } from "@/firebase/firestore"

export type FormatCategory = "desktop" | "mobile" | "video" | "social"

export type AdBuilderEntry = AdTypeOption & {
  Builder?: ComponentType<{ initialData?: AdRecord }>
  helperText?: string
  category: FormatCategory
  image?: string // Preview image URL
}

export const adBuilderRegistry: AdBuilderEntry[] = [
  {
    id: "push-expandable",
    title: "Push Expandable",
    description: "Carga 2 creatividades y genera PNGs recortados + ZIP con HTML/manifest.",
    dimensions: "970x90, 970x250",
    status: "live",
    category: "desktop",
    image: "/desktop-billboard-ad.jpg",
    Builder: PushExpandableBuilder,
    helperText:
      "Subi las creatividades <strong>collapsed</strong> y <strong>expanded</strong> (de cualquier tamano). El builder genera automaticamente los PNG exactos de <strong>970x90</strong> y <strong>970x250</strong>, muestra una previsualizacion del recorte y exporta un ZIP con <strong>index.html</strong> + <strong>manifest</strong>.",
  },
  {
    id: "puzzle-300",
    title: "Puzzle 300x250",
    description: "Puzzle interactivo con logo, textos editables y background.",
    dimensions: "300x250",
    status: "live",
    category: "desktop", // Could be mobile too, but listing generally
    image: "/desktop-medium-rectangle-ad.jpg",
    Builder: Puzzle300Builder,
    helperText:
      "Subi el <strong>background</strong> (archivo o URL) y el <strong>logo</strong>. Completa los textos y genera el ZIP con <strong>index.html</strong> + <strong>manifest</strong> + assets.",
  },
  {
    id: "colorad-300",
    title: "ColorAd 300x250",
    description: "Juego de reflejos: click solo cuando la imagen esta a color.",
    dimensions: "300x250",
    status: "live",
    category: "desktop",
    image: "/desktop-medium-rectangle-ad.jpg",
    Builder: ColorAdBuilder,
    helperText:
      "Subi el <strong>logo</strong>, la imagen en <strong>ByN</strong> y la imagen a <strong>color</strong>. Defini el color principal y la URL destino. Exporta un ZIP con HTML, assets y manifest.",
  },
  {
    id: "podcastwith-300",
    title: "Podcastwith 300x250",
    description: "Snippet de podcast con audio, background y logo.",
    dimensions: "300x250",
    status: "live",
    category: "desktop",
    image: "/desktop-medium-rectangle-ad.jpg",
    Builder: PodcastwithBuilder,
    helperText:
      "Subi el <strong>logo</strong> y el <strong>audio</strong>, suma el background (URL) y textos editables. Exporta un ZIP con HTML, assets y manifest.",
  },
  {
    id: "native-display",
    title: "Native Display",
    description: "Anuncio que se adapta al estilo del publisher. Imagen + Texto + CTA.",
    dimensions: "Responsive",
    status: "live",
    category: "mobile", // Fits well for mobile feeds
    image: "/mobile-large-banner-ad.jpg",
    Builder: NativeBuilder,
    helperText:
      "Completa el <strong>titulo</strong>, <strong>cuerpo</strong> e <strong>imagen</strong>. Este anuncio <strong>no usa Iframe</strong>, se inyecta directamente en la pagina para heredar las fuentes y estilos del sitio web.",
  },
]
