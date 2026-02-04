"use client"

import type { ComponentType } from "react"

import type { AdTypeOption } from "@/components/ad-type-selector"
import { PushExpandableBuilder } from "@/components/ad-builder/builders/push-expandable-builder"
import { Puzzle300Builder } from "@/components/ad-builder/builders/puzzle-300-builder"
import { ColorAdBuilder } from "@/components/ad-builder/builders/colorad-builder"
import { PodcastwithBuilder } from "@/components/ad-builder/builders/podcastwith-builder"
import { NativeBuilder } from "@/components/ad-builder/builders/native-builder"
import { ScratchAdBuilder } from "@/components/ad-builder/builders/scratch-ad-builder"
import { ParallaxBuilder } from "@/components/ad-builder/builders/parallax-builder"
import { InterstitialBuilder } from "@/components/ad-builder/builders/interstitial-builder"
import { SkinBuilder } from "@/components/ad-builder/builders/skin-builder"
import { SideRailBuilder } from "@/components/ad-builder/builders/side-rail-builder"
import { InterscrollerBuilder } from "@/components/ad-builder/builders/interscroller-builder"

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
    image: "/previews/billboard-layout.png",
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
    image: "/previews/mrec-layout.png",
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
    image: "/previews/colorad-layout.png",
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
    image: "/previews/podcastwith-layout.png",
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
    image: "/previews/native-layout.png",
    Builder: NativeBuilder,
    helperText:
      "Completa el <strong>titulo</strong>, <strong>cuerpo</strong> e <strong>imagen</strong>. Este anuncio <strong>no usa Iframe</strong>, se inyecta directamente en la pagina para heredar las fuentes y estilos del sitio web.",
  },
  {
    id: "scratch-off-300",
    title: "Scratch-Off 300x250",
    description: "Formato gamificado donde el usuario raspa para revelar un premio o mensaje.",
    dimensions: "300x250",
    status: "live",
    category: "desktop", // Works on mobile too
    image: "/previews/scratchoff-layout.png",
    Builder: ScratchAdBuilder,
    helperText:
      "Subi la <strong>Cover Image</strong> (lo que se raspa) y la <strong>Back Image</strong> (lo que se revela). El usuario interactuara arrastrando el mouse o el dedo. Exporta un ZIP con HTML Canvas logic.",
  },
  {
    id: "parallax-banner",
    title: "Parallax Billboard",
    description: "Anuncio de gran impacto con efecto de profundidad al hacer scroll.",
    dimensions: "970x250",
    status: "live",
    category: "desktop",
    image: "/previews/billboard-layout.png",
    Builder: ParallaxBuilder,
    helperText:
      "Subi un <strong>Fondo</strong> (que se movera mas lento) y opcionalmente un <strong>Logo/Overlay</strong>. El efecto parallax se activa automaticamente al hacer scroll.",
  },
  {
    id: "interstitial-full",
    title: "Interstitial Full-Page",
    description: "Anuncio a pantalla completa altamente impactante con temporizador.",
    dimensions: "Fullscreen",
    status: "live",
    category: "mobile",
    image: "/previews/interstitial-layout.png",
    Builder: InterstitialBuilder,
    helperText:
      "Configura una experiencia de pantalla completa. Incluye <strong>Fondo</strong>, <strong>Logo</strong>, <strong>Headline</strong> y un temporizador de autocierre para no afectar la UX.",
  },
  {
    id: "desktop-skin",
    title: "Desktop Wallpaper (Skin)",
    description: "Premium wallpaper that surrounds the site content.",
    dimensions: "Full Width",
    status: "live",
    category: "desktop",
    image: "/previews/skin-layout.png",
    Builder: SkinBuilder,
    helperText: "Un wallpaper premium que envuelve el contenido del sitio. Ideal para branding de alto impacto en Desktop.",
  },
  {
    id: "side-rail",
    title: "Side-Rail Takeover",
    description: "Sticky vertical banners in the site's gutters.",
    dimensions: "160x1050",
    status: "live",
    category: "desktop",
    image: "/previews/skin-layout.png",
    Builder: SideRailBuilder,
    helperText: "Banners verticales pegajosos que siguen el scroll a los costados del contenido. Selecciona izquierda, derecha o ambos.",
  },
  {
    id: "interscroller-desktop",
    title: "Scroll-Reveal (Interscroller)",
    description: "Immersive image revealed through a sliding window.",
    dimensions: "Full View",
    status: "live",
    category: "desktop",
    image: "/previews/interscroller-layout.png",
    Builder: InterscrollerBuilder,
    helperText: "Una imagen inmersiva que se revela a traves de una ventana deslizante entre el contenido del sitio.",
  },
]
