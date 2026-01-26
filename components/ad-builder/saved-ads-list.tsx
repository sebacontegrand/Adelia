"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ExternalLink, Edit, Copy, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getUserAds, deleteAdRecord, type AdRecord } from "@/firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface SavedAdsListProps {
    userId: string
    onSelectAd: (ad: AdRecord & { id: string }) => void
}

export function SavedAdsList({ userId, onSelectAd }: SavedAdsListProps) {
    const { toast } = useToast()
    const [ads, setAds] = useState<(AdRecord & { id: string })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAds() {
            if (!userId) return
            try {
                const data = await getUserAds(userId)
                setAds(data)
            } catch (error) {
                console.error("Failed to fetch ads", error)
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los anuncios.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }
        fetchAds()
    }, [userId, toast])

    const copyScript = (ad: AdRecord & { id: string }) => {
        const script = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${ad.id}";
  d.style.width = "300px";
  d.style.height = "250px"; 
  d.style.position = "relative";

  var clickMacro = "%%CLICK_URL_UNESC%%";
 
  var separator = "${ad.htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${ad.htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "300";
  f.height = "250";
  f.style.border = "none";
  f.scrolling = "no";
  
  d.appendChild(f);
  document.currentScript.parentNode.insertBefore(d, document.currentScript);
})();
</script>`
        navigator.clipboard.writeText(script)
        toast({ title: "Script copiado", description: "Pegalo en tu HTML." })
    }

    const handleDelete = async (adId: string) => {
        if (!confirm("Are you sure you want to delete this ad? This action cannot be undone.")) return

        try {
            await deleteAdRecord(adId)
            setAds((prev) => prev.filter((ad) => ad.id !== adId))
            toast({ title: "Ad Deleted", description: "The ad has been permanently removed." })
        } catch (error) {
            console.error("Failed to delete ad", error)
            toast({
                title: "Error",
                description: "No se pudo eliminar el anuncio.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (ads.length === 0) {
        return (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
                <p>No tenes anuncios guardados todavia.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Mis Anuncios Guardados</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Campaña</TableHead>
                            <TableHead>Placement</TableHead>
                            <TableHead>Formato</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ads.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {ad.createdAt ? format(ad.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "-"}
                                </TableCell>
                                <TableCell className="font-medium">{ad.campaign}</TableCell>
                                <TableCell>{ad.placement}</TableCell>
                                <TableCell className="capitalize">{ad.type}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyScript(ad)}
                                            title="Copiar Script"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="Ver HTML"
                                        >
                                            <a href={ad.htmlUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onSelectAd(ad)}
                                            className="gap-2"
                                        >
                                            <Edit className="h-3 w-3" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(ad.id)}
                                            title="Eliminar"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
