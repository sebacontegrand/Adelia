"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdRecord, getAdStats } from "@/firebase/firestore"
import { Button } from "@/components/ui/button"
import { BarChart, Activity, DollarSign, MousePointer, Eye } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/app/context/language-context"

interface AdPerformanceDialogProps {
    ad: AdRecord & { id: string }
}

export function AdPerformanceDialog({ ad }: AdPerformanceDialogProps) {
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)

    // MOCK DATA GENERATOR (Since real stats might be empty for demo)
    // In production, fetch this via getAdStats(ad.id)
    const data = useMemo(() => {
        const days = 7
        const data = []
        const now = new Date()

        // Deterministic random based on ID for consistency
        const seed = ad.id.charCodeAt(0)

        for (let i = days; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)

            // Randomize somewhat realistic stats
            const impressions = Math.floor(1000 + (Math.random() * 5000))
            const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.05))
            const cpm = ad.cpm || 5 // Default $5 CPM
            const revenue = (impressions / 1000) * cpm

            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                impressions,
                clicks,
                revenue: Number(revenue.toFixed(2))
            })
        }
        return data
    }, [ad.id])

    const totalImpressions = data.reduce((acc, curr) => acc + curr.impressions, 0)
    const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0)
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0)
    const ctr = ((totalClicks / totalImpressions) * 100).toFixed(2)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" title="View Analytics">
                    <BarChart className="h-4 w-4 text-blue-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[50vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        {t("dialog.performance")}: {ad.campaign}
                    </DialogTitle>
                    <DialogDescription>
                        {t("dialog.report_desc")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dialog.revenue")}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t("dialog.est_earnings")} ${ad.cpm || 5}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dialog.impressions")}</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dialog.clicks")}</CardTitle>
                            <MousePointer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dialog.ctr")}</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ctr}%</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 h-[300px]">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base">{t("dialog.revenue_trend")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, t("dialog.revenue")]}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base">{t("dialog.imp_vs_clicks")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="impressions" stackId="1" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                                    <Area type="monotone" dataKey="clicks" stackId="2" stroke="#9333ea" fill="#f3e8ff" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
