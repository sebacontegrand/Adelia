"use client"

import { useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import { ExternalLink, Edit, Copy, Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, BarChart2 } from "lucide-react"

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getUserAds, deleteAdRecord, type AdRecord } from "@/firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

interface SavedAdsListProps {
    userId: string
    onSelectAd: (ad: AdRecord & { id: string }) => void
}

type SortConfig = {
    key: string
    direction: "asc" | "desc"
} | null

export function SavedAdsList({ userId, onSelectAd }: SavedAdsListProps) {
    const { toast } = useToast()
    const [ads, setAds] = useState<(AdRecord & { id: string })[]>([])
    const [loading, setLoading] = useState(true)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)
    const [selectedAdForStats, setSelectedAdForStats] = useState<(AdRecord & { id: string }) | null>(null)

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
        // Fallback or use saved dimensions
        const w = ad.settings?.width || 300;
        const h = ad.settings?.expandedHeight || ad.settings?.height || 250;

        const script = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${ad.id}";
  d.style.width = "${w}px";
  d.style.height = "${h}px"; 
  d.style.position = "relative";

  var clickMacro = "%%CLICK_URL_UNESC%%";
 
  var separator = "${ad.htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${ad.htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "${w}";
  f.height = "${h}";
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

    // Helper to extract click URL safely
    const getClickUrl = (ad: AdRecord) => {
        return ad.settings?.clickTag || ad.settings?.cta_url || ad.settings?.url || ""
    }

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const sortedAds = useMemo(() => {
        if (!sortConfig) return ads

        return [...ads].sort((a, b) => {
            let aValue: any = ""
            let bValue: any = ""

            switch (sortConfig.key) {
                case "campaign":
                    aValue = a.campaign || ""
                    bValue = b.campaign || ""
                    break
                case "placement":
                    aValue = a.placement || ""
                    bValue = b.placement || ""
                    break
                case "type":
                    aValue = a.type || ""
                    bValue = b.type || ""
                    break
                case "clickTag":
                    aValue = getClickUrl(a)
                    bValue = getClickUrl(b)
                    break
                case "createdAt":
                    // Fallback to 0 if missing
                    aValue = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
                    bValue = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
                    // For numbers comparison
                    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
                default:
                    return 0
            }

            // String comparison
            return sortConfig.direction === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue))
        })
    }, [ads, sortConfig])

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        if (sortConfig.direction === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
        return <ArrowDown className="ml-2 h-4 w-4" />
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
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("createdAt")}>
                                <div className="flex items-center">Fecha <SortIcon columnKey="createdAt" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("campaign")}>
                                <div className="flex items-center">Campaña <SortIcon columnKey="campaign" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("placement")}>
                                <div className="flex items-center">Placement <SortIcon columnKey="placement" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("type")}>
                                <div className="flex items-center">Formato <SortIcon columnKey="type" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("clickTag")}>
                                <div className="flex items-center">URL de clicktag <SortIcon columnKey="clickTag" /></div>
                            </TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAds.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {ad.createdAt ? format(ad.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "-"}
                                </TableCell>
                                <TableCell className="font-medium">{ad.campaign}</TableCell>
                                <TableCell>{ad.placement}</TableCell>
                                <TableCell className="capitalize">{ad.type}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={getClickUrl(ad)}>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-block max-w-full truncate">
                                        {getClickUrl(ad) || "-"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedAdForStats(ad)}
                                            title="Ver Estadisticas"
                                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                        >
                                            <BarChart2 className="h-4 w-4" />
                                        </Button>
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

            <Dialog open={!!selectedAdForStats} onOpenChange={(open) => !open && setSelectedAdForStats(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Estadisticas: {selectedAdForStats?.campaign}</DialogTitle>
                        <DialogDescription>
                            Placement: {selectedAdForStats?.placement} ({selectedAdForStats?.type})
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAdForStats && (
                        <AnalyticsDashboard adId={selectedAdForStats.id} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
