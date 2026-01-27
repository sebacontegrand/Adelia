"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getUserProfile, type UserProfile } from "@/firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Layout, TrendingUp, Users, ShoppingCart } from "lucide-react"

export default function PublicMediaKitPage() {
    const params = useParams()
    const userId = decodeURIComponent(params.userId as string)

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            loadProfile(userId)
        }
    }, [userId])

    async function loadProfile(id: string) {
        setLoading(true)
        const data = await getUserProfile(id)
        setProfile(data)
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 flex-col gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Media Kit Not Found</h1>
                <p className="text-slate-500">The user "{userId}" has not set up a media kit yet.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20">
                <div className="container mx-auto max-w-5xl px-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {profile.logoUrl && (
                            <img
                                src={profile.logoUrl}
                                alt={profile.displayName}
                                className="w-32 h-32 rounded-full border-4 border-white/10 object-cover bg-white"
                            />
                        )}
                        <div className="text-center md:text-left space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                {profile.displayName || "Untitled Brand"}
                            </h1>
                            <p className="text-lg text-slate-300 max-w-2xl text-balance">
                                {profile.bio || "No bio available."}
                            </p>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2" asChild>
                                <a href={`mailto:${profile.contactEmail}`}>
                                    <Mail className="h-4 w-4" />
                                    Contact for Sponsorships
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-6 py-12 space-y-16">

                {/* Metrics Grid */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        Reach & Audience
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardHeader className="pb-2">
                                <CardDescription>Monthly Views</CardDescription>
                                <CardTitle className="text-4xl font-bold text-slate-900">
                                    {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(profile.trafficStats?.monthlyViews || 0)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> Consistent Growth
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-50 border-slate-200 col-span-1 md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardDescription>Our Audience</CardDescription>
                                <CardTitle className="text-xl font-medium text-slate-700">
                                    {profile.trafficStats?.audience || "No audience data provided."}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Users className="h-4 w-4" /> Verified Data
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <Separator />

                {/* Ad Inventory */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Layout className="h-6 w-6 text-blue-600" />
                        Available Ad Placements
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(!profile.availableSlots || profile.availableSlots.length === 0) && (
                            <p className="text-slate-500 col-span-2 text-center py-12">No active ad slots listed at the moment.</p>
                        )}

                        {profile.availableSlots?.map((slot) => (
                            <Card key={slot.id} className="overflow-hidden border-slate-200 hover:border-blue-300 transition-colors group">
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="secondary" className="mb-2">{slot.format}</Badge>
                                            <CardTitle className="text-xl">{slot.name}</CardTitle>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold block">${slot.price}</span>
                                            <span className="text-xs text-slate-400">/ month</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 min-h-[3rem]">
                                        {slot.description || "High visibility placement suitable for brand awareness."}
                                    </p>
                                </CardContent>
                                <CardFooter className="bg-slate-50 p-4 flex gap-3">
                                    <Button className="w-full" asChild>
                                        <a href={`mailto:${profile.contactEmail}?subject=Inquiry: ${slot.name}`}>
                                            Inquire Now
                                        </a>
                                    </Button>
                                    {/* Future: <Button variant="outline" className="w-full">Preview</Button> */}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}
