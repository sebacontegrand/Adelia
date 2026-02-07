"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdRecord, UserProfile, getAllAds, getAllProfiles, deleteAdRecord, getAllVideos, deleteVideoRecord, type VideoRecord } from "@/firebase/firestore"
import { Loader2, Trash2, ExternalLink, TrendingUp, DollarSign, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { AdPerformanceDialog } from "@/components/admin/ad-performance-dialog"
import { AdManagementDialog } from "@/components/admin/ad-management-dialog"
import { useLanguage } from "@/app/context/language-context"

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const { t } = useLanguage()

    const [isLoading, setIsLoading] = useState(true)
    const [ads, setAds] = useState<(AdRecord & { id: string })[]>([])
    const [profiles, setProfiles] = useState<UserProfile[]>([])
    const [videos, setVideos] = useState<(VideoRecord & { id: string })[]>([])

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
        const [adsData, profilesData, videosData] = await Promise.all([
            getAllAds(),
            getAllProfiles(),
            getAllVideos()
        ])
        setAds(adsData)
        setProfiles(profilesData)
        setVideos(videosData)
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

    const handleDeleteVideo = async (id: string) => {
        if (!confirm("Are you sure you want to delete this video project? This cannot be undone.")) return
        try {
            await deleteVideoRecord(id)
            setVideos(videos.filter(v => v.id !== id))
            toast({ title: "Video Deleted" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete video", variant: "destructive" })
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
        <div className="min-h-screen bg-slate-950 text-white">
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
                    <TabsList className="bg-white/5 border-white/10 p-1 h-12 shadow-2xl mb-6 backdrop-blur-xl">
                        <TabsTrigger
                            value="ads"
                            className="px-8 flex items-center gap-2 text-white/60 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/50 border border-transparent transition-all"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Campaign Analytics ({ads.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="videos"
                            className="px-8 flex items-center gap-2 text-white/60 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/50 border border-transparent transition-all"
                        >
                            <Video className="h-4 w-4" />
                            Video Creator Library ({videos.length})
                        </TabsTrigger>
                        <TabsTrigger value="profiles" className="px-8 flex items-center gap-2 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                            {t("admin.tab.profiles")} ({profiles.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ads">
                        <Card className="bg-slate-900/50 border-white/10 shadow-xl backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white">{t("admin.ads.title")}</CardTitle>
                                <CardDescription className="text-white/60">{t("admin.ads.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10">
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">{t("admin.table.campaign")}</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">{t("admin.table.type")}</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">{t("admin.table.status")}</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">Reach</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">Engagement</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">CTR</TableHead>
                                            <TableHead className="font-bold text-white uppercase tracking-wider text-[10px]">Created</TableHead>
                                            <TableHead className="text-right font-bold text-white uppercase tracking-wider text-[10px]">{t("admin.table.actions")}</TableHead>
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
                                                                            ad.type === "vertical-gallery" ? "Video Gallery" :
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
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Impressions</span>
                                                        <span className="font-mono text-sm">{ad.totalImpressions || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Clicks</span>
                                                        <span className="font-mono text-sm">{ad.totalClicks || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">CTR</span>
                                                        <span className="font-mono text-sm">
                                                            {ad.totalImpressions ? ((ad.totalClicks || 0) / ad.totalImpressions * 100).toFixed(2) : "0.00"}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : "Unknown"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {ad.type === 'push-expandable' ? (
                                                            ad.zipUrl && (
                                                                <Link href={ad.zipUrl} target="_blank">
                                                                    <Button size="icon" variant="ghost" title="Download ZIP" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            )
                                                        ) : (
                                                            <AdManagementDialog ad={ad} />
                                                        )}

                                                        <AdPerformanceDialog ad={ad} />

                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10 border border-red-500/10" onClick={() => handleDeleteAd(ad.id)}>
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

                    <TabsContent value="videos">
                        <Card className="bg-slate-900/50 border-white/10 shadow-xl backdrop-blur-sm">
                            <CardHeader className="border-b border-white/10 bg-emerald-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                        <Video className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-white">Video Creator Library</CardTitle>
                                        <CardDescription className="text-emerald-400/70">Reusable video projects saved from the Remotion toolkit.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project Name</TableHead>
                                            <TableHead>Headline</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Format</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {videos.map((video) => (
                                            <TableRow key={video.id}>
                                                <TableCell className="font-medium">{video.name}</TableCell>
                                                <TableCell className="text-sm italic text-slate-600">"{video.settings.headline}"</TableCell>
                                                <TableCell>{video.userId}</TableCell>
                                                <TableCell>
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                                        {video.settings.width}x{video.settings.height}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {video.createdAt?.toDate ? video.createdAt.toDate().toLocaleDateString() : "Unknown"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDeleteVideo(video.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">{t("admin.total_revenue")}</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-400">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-white/40">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">{t("admin.total_ads")}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{adsCount}</div>
                </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">{t("admin.active_kits")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{profilesCount}</div>
                </CardContent>
            </Card>
        </div>
    )
}
