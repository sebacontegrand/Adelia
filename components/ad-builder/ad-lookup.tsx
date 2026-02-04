"use client"

import { useState } from "react"
import { Search, Sparkles, LayoutGrid, Smartphone, Monitor, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type AdBuilderEntry, adBuilderRegistry } from "./registry"

interface AdLookupProps {
    onSelectTemplate: (adType: string, initialData?: any) => void
}

const TEMPLATES = [
    {
        id: "luxury-watch-parallax",
        type: "parallax-banner",
        title: "Luxury Watch Parallax",
        description: "Perfecto para marcas premium con fondos de alta resolucion.",
        category: "desktop",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
        data: {
            settings: {
                headline: "Elegancia en cada segundo",
                ctaText: "Ver Coleccion",
                parallaxSpeed: 0.7,
                url: "https://example.com/watches"
            }
        }
    },
    {
        id: "tech-event-interstitial",
        type: "interstitial-full",
        title: "Tech Event Interstitial",
        description: "Anuncio a pantalla completa para lanzamientos de productos.",
        category: "mobile",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
        data: {
            settings: {
                headline: "The Future of Sound",
                body: "Join us for the hardware event of the year. Limited spots available.",
                ctaText: "Register Now",
                autoClose: 5,
                showTimer: true
            }
        }
    },
    {
        id: "gamified-scratch",
        type: "scratch-off-300",
        title: "Golden Ticket Scratch",
        description: "Aumenta el engagement con una mecanica de raspa y gana.",
        category: "desktop",
        image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1000&auto=format&fit=crop",
        data: {}
    }
]

export function AdLookup({ onSelectTemplate }: AdLookupProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredTemplates = TEMPLATES.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium border border-blue-500/20">
                    <Sparkles className="h-4 w-4" />
                    <span>Inspiracion para tu proxima campaña</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Explora Formatos de Alto Impacto</h2>
                <p className="text-muted-foreground max-w-2xl">
                    Busca entre nuestras creatividades curadas y usalas como base para tus anuncios.
                    Diseñadas especificamente para maximizar el CTR en diarios online.
                </p>
                <div className="relative w-full max-w-xl mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por formato, industria o nombre..."
                        className="pl-10 h-12 bg-card border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="group overflow-hidden border-border bg-card hover:border-blue-500/50 transition-all hover:shadow-lg">
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={template.image}
                                alt={template.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <Badge variant="secondary" className="gap-1">
                                    {template.category === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                    {template.category}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{template.type}</Badge>
                            </div>
                            <CardTitle className="text-xl">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button
                                onClick={() => onSelectTemplate(template.type, template.data)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                Usar como Plantilla
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl border-border">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No se encontraron resultados</h3>
                    <p className="text-muted-foreground">Prueba con otras palabras clave o busca formatos mas generales.</p>
                </div>
            )}
        </div>
    )
}
