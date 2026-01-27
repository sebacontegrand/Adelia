"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdStats } from "@/firebase/firestore"

type DailyStat = {
    date: string
    views?: number
    impressions?: number
    clicks?: number
}

interface AnalyticsDashboardProps {
    adId: string
}

export function AnalyticsDashboard({ adId }: AnalyticsDashboardProps) {
    const [stats, setStats] = useState<DailyStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function loadStats() {
            try {
                const data = await getAdStats(adId, 7)
                if (mounted) setStats(data as DailyStat[])
            } catch (error) {
                console.error(error)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        loadStats()
        return () => { mounted = false }
    }, [adId])

    // Calculate totals
    const totalImpressions = stats.reduce((acc, curr) => acc + (curr.impressions || 0), 0)
    const totalViews = stats.reduce((acc, curr) => acc + (curr.views || 0), 0)
    const totalClicks = stats.reduce((acc, curr) => acc + (curr.clicks || 0), 0)

    // User requested CTR = clicks / views
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00"

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (stats.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No hay datos registrados en los ultimos 7 dias.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalImpressions}</div>
                        <p className="text-xs text-muted-foreground">Ultimos 7 dias</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vistas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                        <p className="text-xs text-muted-foreground">Ultimos 7 dias</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks}</div>
                        <p className="text-xs text-muted-foreground">Ultimos 7 dias</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CTR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ctr}%</div>
                        <p className="text-xs text-muted-foreground">Rendimiento estimado</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Rendimiento Diario</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stats}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split("-").slice(1).join("/")}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                            />
                            <Bar dataKey="impressions" name="Impresiones" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="views" name="Vistas" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="clicks" name="Clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
