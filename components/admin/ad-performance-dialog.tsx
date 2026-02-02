"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdRecord, getAdStats, updateAdRecord } from "@/firebase/firestore"
import { Button } from "@/components/ui/button"
import { BarChart, Activity, DollarSign, MousePointer, Eye, Loader2, Save } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/app/context/language-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AdPerformanceDialogProps {
    ad: AdRecord & { id: string }
}

export function AdPerformanceDialog({ ad }: AdPerformanceDialogProps) {
    const { t } = useLanguage()
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    const [performanceData, setPerformanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Editing states
    const [editCpm, setEditCpm] = useState(ad.cpm || 5.0)
    const [editBudget, setEditBudget] = useState(ad.budget || 100)

    useEffect(() => {
        if (open) {
            loadStats()
        }
    }, [open, ad.id])

    async function loadStats() {
        setLoading(true)
        try {
            const stats = await getAdStats(ad.id, 7)
            const formatted = stats.map((s: any) => {
                const [y, m, d] = s.date.split("-")
                const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
                return {
                    date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    impressions: s.impressions || 0,
                    clicks: s.clicks || 0,
                    revenue: Number(((s.impressions || 0) / 1000 * (editCpm)).toFixed(2))
                }
            })
            setPerformanceData(formatted)
        } catch (error) {
            console.error("Error loading stats:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateFinancials() {
        setSaving(true)
        try {
            await updateAdRecord(ad.id, {
                cpm: editCpm,
                budget: editBudget
            })
            toast({ title: "Updated", description: "Financial settings updated successfully." })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update visuals", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const data = performanceData
    const totalImpressions = ad.totalImpressions || 0
    const totalClicks = ad.totalClicks || 0
    const totalRevenue = (totalImpressions / 1000) * (ad.cpm || 5)
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"

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
                            <p className="text-xs text-muted-foreground">{t("dialog.est_earnings")} ${editCpm}</p>
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

                <Card className="mb-6 border-blue-200 bg-blue-50/50">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">Financial Controls (Admin Only)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3 items-end pb-4">
                        <div className="space-y-2">
                            <Label className="text-xs">CPM ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={editCpm}
                                onChange={(e) => setEditCpm(parseFloat(e.target.value) || 0)}
                                className="h-8 bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Budget ($)</Label>
                            <Input
                                type="number"
                                step="1"
                                value={editBudget}
                                onChange={(e) => setEditBudget(parseFloat(e.target.value) || 0)}
                                className="h-8 bg-white"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleUpdateFinancials}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Update Ad
                        </Button>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground italic">
                        No real data collected yet for this ad. Charts will appear once impressions are recorded.
                    </div>
                ) : (
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
                )}
            </DialogContent>
        </Dialog>
    )
}
