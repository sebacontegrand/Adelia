"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Upload, Save, Image as ImageIcon, Copy, X } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { type AdRecord, saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SlotSelector } from "@/components/ad-builder/slot-selector"
import { AdScriptResult } from "@/components/ad-builder/ad-script-result"

export function NativeBuilder({ initialData }: { initialData?: AdRecord & { id?: string } }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // Form State
    const [headline, setHeadline] = useState(initialData?.settings?.headline || "")
    const [body, setBody] = useState(initialData?.settings?.body || "")
    const [ctaText, setCtaText] = useState(initialData?.settings?.ctaText || "Learn More")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url || "")
    const [imageUrl, setImageUrl] = useState(initialData?.settings?.imageUrl || "")

    // Campaign & Slot
    const [campaign, setCampaign] = useState(initialData?.campaign || "")
    const [placement, setPlacement] = useState(initialData?.placement || "")
    // Manual Target
    const [manualTargetId, setManualTargetId] = useState(initialData?.settings?.targetElementId || "")

    // Pricing & Budget
    const [cpm, setCpm] = useState<number>(initialData?.cpm || 5.0)
    const [budget, setBudget] = useState<number>(initialData?.budget || 100)

    const [isWorking, setIsWorking] = useState(false)

    // Output Output
    const [embedScript, setEmbedScript] = useState("")

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                campaign: campaign || "native-draft",
                fileName: file.name
            })
            setImageUrl(url)
            toast({ title: "Image Uploaded", description: "Your native ad image is ready." })
        } catch (err: any) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const handleSave = async () => {
        if (!campaign || !placement || !headline || !targetUrl || !imageUrl) {
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
            // Determine final placement logic
            let finalPlacement = placement
            let finalTargetId = ""

            if (placement === "manual") {
                finalPlacement = "" // Clear placement ID so API falls back to settings.targetElementId
                finalTargetId = manualTargetId.replace(/^#/, "") // Remove # if user typed it
            }

            // For Native Ads, we don't generate HTML/ZIP. We save the data directly.
            const settings = {
                headline,
                body,
                ctaText,
                imageUrl,
                url: targetUrl, // Standard Click URL
                type: "native",
                targetElementId: finalTargetId
            }

            const adData: AdRecord = {
                userId: session.user.email,
                campaign,
                placement: finalPlacement,
                type: "native-display",
                zipUrl: "-", // No ZIP
                assets: {},
                htmlUrl: "-", // No HTML file
                settings,
                cpm,
                budget,
                status: initialData?.status || "active"
            }

            // Pass ID as second arg if it exists (for updates)
            await saveAdRecord(adData, initialData?.id)

            // Generate Code Snippet
            const origin = window.location.origin
            const targetDivId = finalPlacement ? finalPlacement : finalTargetId
            const code = `<!-- 1. Place this container where you want the ad -->
<div id="${targetDivId}"></div>

<!-- 2. Add the AdPilot script to your <head> (only once) -->
<script src="${origin}/adpilot.js?id=${session.user.email}" async></script>`

            setEmbedScript(code)

            toast({ title: "Ad Saved!", description: "Native ad configuration updated." })
        } catch (err: any) {
            console.error(err)
            toast({ title: "Error", description: "Failed to save native ad.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }


    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 relative">
            <div className="space-y-6">
                {/* Editor */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Native Ad Content</CardTitle>
                        <CardDescription>Define the text and image that will blend into the publisher's site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                                value={headline}
                                onChange={e => setHeadline(e.target.value)}
                                placeholder="e.g. The New SUV from Toyota"
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
                                <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Learn More" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image (1200x628 rec.)</Label>
                                <Input type="file" onChange={handleImageUpload} accept="image/*" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Target URL</Label>
                            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Campaign Settings */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Campaign Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Campaign Name</Label>
                            <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="e.g. Summer Sale 2026" />
                        </div>

                        <SlotSelector
                            value={placement}
                            onChange={(val, price) => {
                                setPlacement(val)
                                if (price) setCpm(price)
                            }}
                        />

                        {placement === "manual" && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-md border text-sm">
                                <Label>HTML Container ID</Label>
                                <Input
                                    value={manualTargetId}
                                    onChange={e => setManualTargetId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                                    placeholder="e.g. sidebar-ad-1"
                                />
                                <p className="text-muted-foreground text-xs">
                                    You will need to create a <code>&lt;div id="{manualTargetId || "..."}"&gt;&lt;/div&gt;</code> on your site.
                                </p>
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

            {/* Preview */}
            {/* Preview & Output */}
            <div className="space-y-6">
                {/* Embed Script Output */}
                <AdScriptResult script={embedScript} />

                <Card className="border-border bg-card sticky top-24">
                    <CardHeader>
                        <CardTitle>Native Preview</CardTitle>
                        <CardDescription>
                            How it might look (Publisher styles may vary).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-neutral-900 max-w-md mx-auto font-sans">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Ad Visual" className="w-full h-48 object-cover rounded mb-4" />
                            ) : (
                                <div className="w-full h-48 bg-slate-200 dark:bg-neutral-800 rounded mb-4 flex items-center justify-center text-slate-400">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                                {headline || "Ad Headline Here"}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                                {body || "Ad body text will appear here. It usually contains a brief description of the product or service being advertised."}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 uppercase tracking-widest">Sponsored</span>
                                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                                    {ctaText}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-muted/50 rounded text-xs text-muted-foreground">
                            <strong>Note:</strong> Since this is a "Native" ad, the final fonts and colors will adapt to the newspaper's website CSS to blend in perfectly.
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
