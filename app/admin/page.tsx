"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdRecord, UserProfile, getAllAds, getAllProfiles, deleteAdRecord } from "@/firebase/firestore"
import { Loader2, Trash2, ExternalLink, TrendingUp, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { AdPerformanceDialog } from "@/components/admin/ad-performance-dialog"
import { useLanguage } from "@/app/context/language-context"

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const { t } = useLanguage()

    const [isLoading, setIsLoading] = useState(true)
    const [ads, setAds] = useState<(AdRecord & { id: string })[]>([])
    const [profiles, setProfiles] = useState<UserProfile[]>([])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (status === "authenticated") {
            const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
            if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
                router.push("/")
                return
            }
            loadData()
        }
    }, [status, session])

    async function loadData() {
        setIsLoading(true)
        const [adsData, profilesData] = await Promise.all([
            getAllAds(),
            getAllProfiles()
        ])
        setAds(adsData)
        setProfiles(profilesData)
        setIsLoading(false)
    }

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Are you sure you want to delete this ad? This cannot be undone.")) return
        try {
            await deleteAdRecord(id)
            setAds(ads.filter(ad => ad.id !== id))
            toast({ title: "Ad Deleted" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete ad", variant: "destructive" })
        }
    }

    // Calculate aggregated stats using real data
    const totalRevenue = ads.reduce((acc, ad) => {
        const clicks = ad.totalClicks || 0
        const impressions = ad.totalImpressions || 0
        const cpm = ad.cpm || 5
        // We can model revenue either by CPM (impressions) or CPC. 
        // Here we stick to CPM since the user input is CPM.
        return acc + (impressions / 1000) * cpm
    }, 0)

    const totalImpressions = ads.reduce((acc, ad) => acc + (ad.totalImpressions || 0), 0)
    const totalClicks = ads.reduce((acc, ad) => acc + (ad.totalClicks || 0), 0)

    if (status === "loading" || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="container mx-auto py-10 px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {t("admin.title")}
                        </h1>
                        <p className="text-slate-500">{t("admin.subtitle")}</p>
                    </div>
                    <Button onClick={loadData} variant="outline">{t("admin.refresh")}</Button>
                </div>

                <GenericStats
                    adsCount={ads.length}
                    profilesCount={profiles.length}
                    revenue={totalRevenue}
                    t={t}
                />

                <Tabs defaultValue="ads" className="mt-8">
                    <TabsList className="bg-white border">
                        <TabsTrigger value="ads">{t("admin.tab.ads")} ({ads.length})</TabsTrigger>
                        <TabsTrigger value="profiles">{t("admin.tab.profiles")} ({profiles.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ads">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("admin.ads.title")}</CardTitle>
                                <CardDescription>{t("admin.ads.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("admin.table.campaign")}</TableHead>
                                            <TableHead>{t("admin.table.type")}</TableHead>
                                            <TableHead>{t("admin.table.user")}</TableHead>
                                            <TableHead>{t("admin.table.status")}</TableHead>
                                            <TableHead>{t("admin.table.impressions") || "Impresiones"}</TableHead>
                                            <TableHead>{t("admin.table.clicks") || "Clicks"}</TableHead>
                                            <TableHead>{t("admin.table.created")}</TableHead>
                                            <TableHead className="text-right">{t("admin.table.actions")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ads.map((ad) => (
                                            <TableRow key={ad.id}>
                                                <TableCell className="font-medium">{ad.campaign}</TableCell>
                                                <TableCell>
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                                        {ad.type === "mini-game-gated" ? "Gated Mini-Game" :
                                                            ad.type === "native-video" ? "Native Video" :
                                                                ad.type === "push-expandable" ? "Push Expandable" :
                                                                    ad.type === "side-rail" ? "Side Rail" :
                                                                        ad.type === "interscroller-ad" ? "Interscroller" :
                                                                            ad.type || t("display")}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{ad.userId}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs ${ad.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        ad.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {ad.status === 'active' ? t("status.active") :
                                                            ad.status === 'paused' ? t("status.paused") :
                                                                t("status.draft")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{ad.totalImpressions || 0}</TableCell>
                                                <TableCell className="font-mono text-xs">{ad.totalClicks || 0}</TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : "Unknown"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <AdPerformanceDialog ad={ad} />

                                                        {ad.zipUrl && (
                                                            <Link href={ad.zipUrl} target="_blank">
                                                                <Button size="icon" variant="ghost" title="Download ZIP">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteAd(ad.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="profiles">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("admin.profiles.title")}</CardTitle>
                                <CardDescription>{t("admin.profiles.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("admin.profiles.brand")}</TableHead>
                                            <TableHead>{t("admin.profiles.email")}</TableHead>
                                            <TableHead>{t("admin.profiles.traffic")}</TableHead>
                                            <TableHead>{t("admin.profiles.slots")}</TableHead>
                                            <TableHead className="text-right">{t("admin.profiles.public_page")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {profiles.map((profile) => (
                                            <TableRow key={profile.userId}>
                                                <TableCell className="flex items-center gap-2 font-medium">
                                                    {profile.logoUrl && <img src={profile.logoUrl} className="w-6 h-6 rounded-full object-cover" />}
                                                    {profile.displayName || "Untitled"}
                                                </TableCell>
                                                <TableCell>{profile.contactEmail}</TableCell>
                                                <TableCell>{profile.trafficStats?.monthlyViews || 0} /{t("month")}</TableCell>
                                                <TableCell>{profile.availableSlots?.length || 0}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/mk/${profile.userId}`} target="_blank">
                                                        <Button size="sm" variant="outline">
                                                            {t("admin.profiles.view_page")} <ExternalLink className="ml-2 h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

function GenericStats({ adsCount, profilesCount, revenue, t }: { adsCount: number, profilesCount: number, revenue: number, t: (key: string) => string }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.total_revenue")}</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.total_ads")}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adsCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.active_kits")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{profilesCount}</div>
                </CardContent>
            </Card>
        </div>
    )
}
