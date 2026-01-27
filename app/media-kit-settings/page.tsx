"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getUserProfile, saveUserProfile, type UserProfile } from "@/firebase/firestore"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Plus, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function MediaKitSettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [logoUrl, setLogoUrl] = useState("")

    // Traffic Metrics
    const [monthlyViews, setMonthlyViews] = useState("")
    const [audience, setAudience] = useState("")

    // Slots
    const [slots, setSlots] = useState<Array<{ id: string, name: string, format: string, price: number, description?: string }>>([])

    useEffect(() => {
        if (status === "unauthenticated") {
            signIn()
        } else if (status === "authenticated" && session?.user?.email) {
            // Admin Check
            const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
            if (!adminEmails.includes(session.user.email)) {
                toast({
                    title: "Access Denied",
                    description: "You are not authorized to edit Media Kit settings.",
                    variant: "destructive"
                })
                router.push("/")
                return
            }
            loadProfile(session.user.email)
        }
    }, [status, session])

    async function loadProfile(userId: string) {
        setIsLoading(true)
        const profile = await getUserProfile(userId)
        if (profile) {
            setDisplayName(profile.displayName || "")
            setBio(profile.bio || "")
            setContactEmail(profile.contactEmail || session?.user?.email || "")
            setLogoUrl(profile.logoUrl || "")
            setMonthlyViews(profile.trafficStats?.monthlyViews?.toString() || "")
            setAudience(profile.trafficStats?.audience || "")
            setSlots(profile.availableSlots || [])
        } else {
            // Defaults
            setContactEmail(session?.user?.email || "")
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        if (!session?.user?.email) return
        setIsSaving(true)
        try {
            const profileData: Partial<UserProfile> = {
                displayName,
                bio,
                logoUrl,
                contactEmail,
                trafficStats: {
                    monthlyViews: Number(monthlyViews) || 0,
                    audience
                },
                availableSlots: slots
            }

            await saveUserProfile(session.user.email, profileData)
            toast({ title: "Profile Saved", description: "Your media kit has been updated." })
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const addSlot = () => {
        setSlots([...slots, { id: Date.now().toString(), name: "New Slot", format: "Display Banner", price: 100 }])
    }

    const removeSlot = (id: string) => {
        setSlots(slots.filter(s => s.id !== id))
    }

    const updateSlot = (id: string, field: string, value: any) => {
        setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    if (status === "loading" || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    const publicUrl = session?.user?.email ? `/mk/${encodeURIComponent(session.user.email)}` : "#"

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="container mx-auto max-w-4xl p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Media Kit Settings</h1>
                        <p className="text-slate-400">Configure your public sales page.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={publicUrl} target="_blank">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-neutral-800 bg-transparent">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Public Page
                            </Button>
                        </Link>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-slate-200">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* General Info */}
                    <Card className="bg-neutral-900 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>Brand Profile</CardTitle>
                            <CardDescription className="text-slate-400">How you appear to advertisers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. TechDaily Blog" className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>Bio / About Us</Label>
                                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your audience and content..." className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metrics */}
                    <Card className="bg-neutral-900 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>Traffic Metrics</CardTitle>
                            <CardDescription className="text-slate-400">Highlight your reach.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Monthly Views</Label>
                                <Input type="number" value={monthlyViews} onChange={e => setMonthlyViews(e.target.value)} placeholder="e.g. 50000" className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>Audience Description</Label>
                                <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Tech enthusiasts, aged 25-40" className="bg-neutral-950 border-white/10 text-white placeholder:text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Inventory / Slots */}
                <Card className="bg-neutral-900 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Ad Inventory</CardTitle>
                            <CardDescription className="text-slate-400">Define the slots you are selling.</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={addSlot} className="border-white/10 text-white hover:bg-neutral-800 bg-transparent">
                            <Plus className="mr-2 h-4 w-4" /> Add Slot
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {slots.length === 0 && (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                                No slots defined yet. Add one to start selling!
                            </div>
                        )}
                        {slots.map((slot) => (
                            <div key={slot.id} className="flex gap-4 items-start p-4 bg-neutral-950 rounded-lg border border-white/10">
                                <div className="grid gap-4 flex-1 md:grid-cols-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Name</Label>
                                        <Input value={slot.name} onChange={e => updateSlot(slot.id, "name", e.target.value)} placeholder="Slot Name" className="bg-neutral-900 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Format</Label>
                                        <Input value={slot.format} onChange={e => updateSlot(slot.id, "format", e.target.value)} placeholder="e.g. Banner 728x90" className="bg-neutral-900 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Price ($)</Label>
                                        <Input type="number" value={slot.price} onChange={e => updateSlot(slot.id, "price", Number(e.target.value))} className="bg-neutral-900 border-white/10 text-white" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-xs text-slate-400">Description</Label>
                                        <Input value={slot.description || ""} onChange={e => updateSlot(slot.id, "description", e.target.value)} placeholder="Placement details..." className="bg-neutral-900 border-white/10 text-white" />
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-neutral-800 mt-6" onClick={() => removeSlot(slot.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
