"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Plus, Save, Video, Trash2, GripVertical, Sparkles as SparklesIcon } from "lucide-react"
import { type AdRecord, saveAdRecord, getUserVideos, type VideoRecord } from "@/firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SlotSelector } from "@/components/ad-builder/slot-selector"
import { AdScriptResult } from "@/components/ad-builder/ad-script-result"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Player } from "@remotion/player"
import { VideoGallery } from "@/remotion/VideoGallery"

export function VerticalVideoGalleryBuilder({ initialData }: { initialData?: AdRecord & { id?: string } }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // State for selected videos
    const [selectedVideos, setSelectedVideos] = useState<(VideoRecord & { id: string })[]>(initialData?.settings?.videos || [])

    // Campaign & Slot
    const [campaign, setCampaign] = useState(initialData?.campaign || "")
    const [placement, setPlacement] = useState(initialData?.placement || "")
    const [manualTargetId, setManualTargetId] = useState(initialData?.settings?.targetElementId || "")
    const [cpm, setCpm] = useState<number>(initialData?.cpm || 12.0)
    const [budget, setBudget] = useState<number>(initialData?.budget || 500)

    // Total duration calculation: 150 frames per video
    const VIDEO_DURATION = 150;
    const totalDuration = selectedVideos.length > 0 ? selectedVideos.length * VIDEO_DURATION : 150;

    const [isWorking, setIsWorking] = useState(false)
    const [embedScript, setEmbedScript] = useState("")

    // Selector State
    const [availableVideos, setAvailableVideos] = useState<(VideoRecord & { id: string })[]>([])
    const [isFetching, setIsFetching] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchVideos = async () => {
        if (!session?.user?.email) return
        setIsFetching(true)
        try {
            const videos = await getUserVideos(session.user.email)
            setAvailableVideos(videos)
        } catch (err) {
            console.error("Error fetching videos:", err)
        } finally {
            setIsFetching(false)
        }
    }

    const addVideo = (video: VideoRecord & { id: string }) => {
        if (selectedVideos.length >= 3) {
            toast({ title: "Limit Reached", description: "The maximum amount of videos for this gallery is 3.", variant: "destructive" })
            return
        }
        setSelectedVideos([...selectedVideos, video])
        setIsDialogOpen(false)
        toast({ title: "Video Added", description: "Project added to your gallery sequence." })
    }

    const removeVideo = (index: number) => {
        setSelectedVideos(selectedVideos.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        console.log("Gallery Save initiated", { campaign, placement, selectedVideosCount: selectedVideos.length })

        if (!campaign || !placement || selectedVideos.length === 0) {
            console.warn("Gallery Save blocked: Missing fields", { campaign, placement, selectedVideosCount: selectedVideos.length })
            toast({ title: "Missing Fields", description: "Please enter a campaign name and select at least one video.", variant: "destructive" })
            return
        }

        if (!session?.user?.email) {
            console.error("Gallery Save blocked: No active session")
            return
        }

        setIsWorking(true)
        try {
            const settings = {
                videos: selectedVideos,
                targetElementId: manualTargetId.replace(/^#/, ""),
                type: "vertical-gallery"
            }

            const adData: AdRecord = {
                userId: session.user.email,
                campaign,
                placement: placement === "manual" ? "" : placement,
                type: "vertical-gallery",
                assets: {},
                settings,
                cpm,
                budget,
                status: initialData?.status || "active"
            }

            console.log("Saving Gallery record to DB...", adData)
            const adId = await saveAdRecord(adData, initialData?.id)
            console.log("Gallery Save successful! ID:", adId)

            const origin = window.location.origin
            const targetDivId = placement === "manual" ? manualTargetId.replace(/^#/, "") : placement

            const code = `<!-- Adelia Vertical Gallery -->
<div id="${targetDivId}"></div>
<script src="${origin}/adpilot.js?id=${session.user.email}" async></script>`

            setEmbedScript(code)
            toast({ title: "Gallery Saved!", description: "Vertical Video Gallery is now preserved in Adelia DB." })
        } catch (err) {
            console.error("CRITICAL: Gallery Save failed", err)
            toast({ title: "Save Failed", description: "Could not save the gallery. Check console for details.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    return (
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-6">
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Gallery Sequence</CardTitle>
                        <CardDescription>Select up to 3 videos for your vertical feed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {selectedVideos.map((video, idx) => (
                                <div key={`${video.id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 group">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{video.name || video.settings.headline}</p>
                                        <p className="text-[10px] text-muted-foreground">Position {idx + 1}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeVideo(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {selectedVideos.length < 3 && (
                                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                                    setIsDialogOpen(open);
                                    if (open) fetchVideos();
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full border-dashed py-8 flex flex-col gap-2 h-auto text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/50">
                                            <div className="p-2 rounded-full bg-muted group-hover:bg-emerald-100">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">Add Video</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md bg-white">
                                        <DialogHeader>
                                            <DialogTitle>Add to Gallery</DialogTitle>
                                            <DialogDescription>Choose a video from your creator library.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
                                            {isFetching ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                                </div>
                                            ) : availableVideos.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    No videos found. Create some in the Video Creator first!
                                                </div>
                                            ) : (
                                                availableVideos.map(video => (
                                                    <button
                                                        key={video.id}
                                                        onClick={() => addVideo(video)}
                                                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-emerald-500/50 hover:bg-emerald-50 select-none transition-all group"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-slate-900 group-hover:text-emerald-700">{video.name}</span>
                                                            <Plus className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{video.settings.headline}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
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
                            <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="e.g. Gallery Promo 2026" />
                        </div>

                        <SlotSelector
                            value={placement}
                            onChange={(val, price) => {
                                setPlacement(val)
                                if (price) setCpm(price * 2)
                            }}
                        />

                        {placement === "manual" && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-md border text-sm">
                                <Label>HTML Container ID</Label>
                                <Input
                                    value={manualTargetId}
                                    onChange={e => setManualTargetId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                                    placeholder="e.g. my-gallery-root"
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

            <div className="lg:col-span-7 space-y-6">
                <Card className="border-border bg-card overflow-hidden shadow-2xl sticky top-8">
                    <CardHeader className="p-4 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0 text-white">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <CardTitle className="text-sm font-bold">Vertical Feed Preview</CardTitle>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedVideos.length} / 3 Videos</span>
                    </CardHeader>
                    <CardContent className="p-0 bg-black flex flex-col items-center">
                        <div className="w-full h-[568px] relative bg-black flex flex-col items-center">
                            {selectedVideos.length > 0 ? (
                                <Player
                                    component={VideoGallery as any}
                                    durationInFrames={totalDuration}
                                    compositionWidth={1080}
                                    compositionHeight={1920}
                                    fps={30}
                                    style={{ width: '320px', height: '568px' }}
                                    controls={true}
                                    loop
                                    autoPlay
                                    inputProps={{
                                        videos: selectedVideos.map(v => v.settings)
                                    }}
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-4 p-8 text-center bg-slate-950">
                                    <Video className="h-12 w-12 opacity-20" />
                                    <p className="text-sm">Select videos from your library to preview the vertical feed.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <AdScriptResult script={embedScript} />
            </div>
        </div>
    )
}
