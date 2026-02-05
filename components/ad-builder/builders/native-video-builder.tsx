"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Upload, Save, Video, Copy, X } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { type AdRecord, saveAdRecord } from "@/firebase/firestore"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SlotSelector } from "@/components/ad-builder/slot-selector"

export function NativeVideoBuilder({ initialData }: { initialData?: AdRecord & { id?: string } }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // Form State
    const [headline, setHeadline] = useState(initialData?.settings?.headline || "")
    const [body, setBody] = useState(initialData?.settings?.body || "")
    const [ctaText, setCtaText] = useState(initialData?.settings?.ctaText || "Learn More")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url || "")
    const [videoUrl, setVideoUrl] = useState(initialData?.settings?.videoUrl || "")

    // Campaign & Slot
    const [campaign, setCampaign] = useState(initialData?.campaign || "")
    const [placement, setPlacement] = useState(initialData?.placement || "")
    const [manualTargetId, setManualTargetId] = useState(initialData?.settings?.targetElementId || "")

    // Pricing & Budget
    const [cpm, setCpm] = useState<number>(initialData?.cpm || 8.0) // Video typically has higher CPM
    const [budget, setBudget] = useState<number>(initialData?.budget || 200)

    const [isWorking, setIsWorking] = useState(false)

    // Output Output
    const [embedScript, setEmbedScript] = useState("")

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!session?.user?.email) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "native-video-draft",
                fileName: file.name
            })
            setVideoUrl(url)
            toast({ title: "Video Uploaded", description: "Your native video is ready." })
        } catch (err: any) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload video.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const handleSave = async () => {
        if (!campaign || !placement || !headline || !targetUrl || !videoUrl) {
            toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" })
            return
        }

        if (placement === "manual" && !manualTargetId) {
            toast({ title: "Missing Target ID", description: "Please enter the HTML ID where this ad will appear.", variant: "destructive" })
            return
        }

        if (!session?.user?.email) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        try {
            let finalPlacement = placement
            let finalTargetId = ""

            if (placement === "manual") {
                finalPlacement = ""
                finalTargetId = manualTargetId.replace(/^#/, "")
            }

            const settings = {
                headline,
                body,
                ctaText,
                videoUrl,
                url: targetUrl,
                type: "native-video",
                targetElementId: finalTargetId
            }

            const adData: AdRecord = {
                userId: session.user.email,
                campaign,
                placement: finalPlacement,
                type: "native-video",
                zipUrl: "-",
                assets: {},
                htmlUrl: "-",
                settings,
                cpm,
                budget,
                status: initialData?.status || "active"
            }

            await saveAdRecord(adData, initialData?.id)

            const origin = window.location.origin
            const targetDivId = finalPlacement ? finalPlacement : finalTargetId
            const code = `<!-- 1. Place this container where you want the ad -->
<div id="${targetDivId}"></div>

<!-- 2. Add the AdPilot script to your <head> (only once) -->
<script src="${origin}/adpilot.js?id=${session.user.email}" async></script>`

            setEmbedScript(code)

            toast({ title: "Ad Saved!", description: "Native video configuration updated." })
        } catch (err: any) {
            console.error(err)
            toast({ title: "Error", description: "Failed to save native video.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(embedScript)
        toast({ title: "Copied!", description: "Code copied to clipboard." })
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 relative">
            <div className="space-y-6">
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Native Video Content</CardTitle>
                        <CardDescription>Define the text and video that will blend into the publisher's site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                                value={headline}
                                onChange={e => setHeadline(e.target.value)}
                                placeholder="e.g. Experience the Future of Driving"
                                maxLength={60}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Body Text</Label>
                            <Textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Brief description (max 120 chars)"
                                maxLength={120}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CTA Text</Label>
                                <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Watch Now" />
                            </div>
                            <div className="space-y-2">
                                <Label>Video (MP4/WebM)</Label>
                                <Input type="file" onChange={handleVideoUpload} accept="video/mp4,video/webm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Target URL</Label>
                            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Campaign Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Campaign Name</Label>
                            <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="e.g. Video Launch 2026" />
                        </div>

                        <SlotSelector
                            value={placement}
                            onChange={(val, price) => {
                                setPlacement(val)
                                if (price) setCpm(price * 1.5) // Auto-boost CPM for video
                            }}
                        />

                        {placement === "manual" && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-md border text-sm">
                                <Label>HTML Container ID</Label>
                                <Input
                                    value={manualTargetId}
                                    onChange={e => setManualTargetId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                                    placeholder="e.g. video-feed-1"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>CPM ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={cpm}
                                    onChange={e => setCpm(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Budget ($)</Label>
                                <Input
                                    type="number"
                                    step="1"
                                    value={budget}
                                    onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <Button onClick={handleSave} disabled={isWorking} className="w-full" size="lg">
                            {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save & Generate Script
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {/* Embed Script Output */}
                {embedScript && (
                    <Card className="border-border bg-card p-6 border-emerald-500/50 bg-emerald-500/5 transition-all animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                                Ad Ready!
                            </h3>
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                                <Copy className="h-4 w-4" /> Copy Script
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Copy and paste this script into your website to embed the ad.
                        </p>
                        <textarea
                            className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-slate-950 text-slate-50 focus:ring-2 focus:ring-emerald-500"
                            readOnly
                            value={embedScript}
                        />
                    </Card>
                )}

                <Card className="border-border bg-card sticky top-24">
                    <CardHeader>
                        <CardTitle>Video Preview</CardTitle>
                        <CardDescription>
                            Autoplay muted preview of your native video ad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-neutral-900 max-w-md mx-auto font-sans">
                            {videoUrl ? (
                                <video
                                    src={videoUrl}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="w-full aspect-video object-cover rounded mb-4"
                                />
                            ) : (
                                <div className="w-full aspect-video bg-slate-200 dark:bg-neutral-800 rounded mb-4 flex items-center justify-center text-slate-400">
                                    <Video className="h-8 w-8" />
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                                {headline || "Ad Headline Here"}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                                {body || "Ad body text will appear here. Native video ads capture more attention."}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 uppercase tracking-widest">Sponsored Video</span>
                                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                                    {ctaText}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
