"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { type AdRecord } from "@/firebase/firestore"
import { Mic, Play, Pause, Plus, Trash2, MessagesSquare, Volume2, Save, Download, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { saveAdRecord } from "@/firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { SlotSelector } from "../slot-selector"
import { AdScriptResult } from "../ad-script-result"

// ElevenLabs Spanish Latin American Voice Options (3 Max)
const SPANISH_LATIN_VOICES = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", accent: "American", description: "Default female voice (Narration)" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", accent: "American", description: "Default male voice (Young)" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", accent: "American", description: "Default male voice (Deep)" }
]

type DialogueLine = {
    id: string
    speaker: "A" | "B"
    text: string
    voiceId: string
}

export function TextDialogueBuilder({ initialData }: { initialData?: AdRecord }) {
    const [campaignName, setCampaignName] = useState(initialData?.settings?.campaignName || "New Text Dialogue Campaign")
    const [lines, setLines] = useState<DialogueLine[]>(initialData?.settings?.lines || [
        { id: "1", speaker: "A", text: "¡Hola! ¿Cómo estás?", voiceId: SPANISH_LATIN_VOICES[0].id },
        { id: "2", speaker: "B", text: "Muy bien, gracias. ¿Y tú?", voiceId: SPANISH_LATIN_VOICES[1].id }
    ])
    const [activeTab, setActiveTab] = useState("dialogue")
    const [isPlaying, setIsPlaying] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isWorking, setIsWorking] = useState(false)
    const [embedScript, setEmbedScript] = useState("")
    const [placement, setPlacement] = useState(initialData?.settings?.placement || "top")
    const [manualTargetId, setManualTargetId] = useState(initialData?.settings?.manualTargetId || "")
    const [cpm, setCpm] = useState(initialData?.cpm || 0.15)
    const [budget, setBudget] = useState(initialData?.budget || 100)

    const { data: session } = useSession()
    const { toast } = useToast()

    // Migration Effect: Ensure all lines use valid voices from the current SPANISH_LATIN_VOICES list
    // This fixes errors if the user has stale voice IDs in their browser/saved data
    useEffect(() => {
        const validIds = SPANISH_LATIN_VOICES.map(v => v.id)
        let hasChanges = false
        const migratedLines = lines.map(line => {
            if (!validIds.includes(line.voiceId)) {
                hasChanges = true
                return {
                    ...line,
                    voiceId: line.speaker === "A" ? SPANISH_LATIN_VOICES[0].id : SPANISH_LATIN_VOICES[1].id
                }
            }
            return line
        })

        if (hasChanges) {
            setLines(migratedLines)
        }
    }, [])

    const handleUpdateSpeakerVoice = (speaker: "A" | "B", voiceId: string) => {
        setLines(lines.map(l => l.speaker === speaker ? { ...l, voiceId } : l))
    }

    const handleGenerate = async () => {
        if (lines.some(l => !l.text.trim())) return

        setIsGenerating(true)
        try {
            const response = await fetch("/api/elevenlabs/generate-dialogue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lines }),
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error("Dialogue Generation Error:", errorBody);
                throw new Error(errorBody.error || "Failed to generate dialogue");
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)
            setActiveTab("dialogue") // Switch back to see transcript
        } catch (error: any) {
            console.error(error)
            alert("Generation Failed: " + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTogglePlay = () => {
        if (!audioUrl) {
            handleGenerate()
            return
        }

        const audio = document.getElementById("dialogue-audio") as HTMLAudioElement
        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleAddLine = () => {
        const lastSpeaker = lines[lines.length - 1]?.speaker || "B"
        const nextSpeaker = lastSpeaker === "A" ? "B" : "A"
        const newId = (lines.length + 1).toString()
        setLines([...lines, {
            id: newId,
            speaker: nextSpeaker,
            text: "",
            voiceId: nextSpeaker === "A" ? SPANISH_LATIN_VOICES[0].id : SPANISH_LATIN_VOICES[1].id
        }])
    }

    const handleRemoveLine = (id: string) => {
        if (lines.length <= 1) return
        setLines(lines.filter(l => l.id !== id))
    }

    const handleUpdateLine = (id: string, updates: Partial<DialogueLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l))
    }

    const handleSave = async () => {
        if (!session?.user?.email) {
            toast({ title: "Login Required", description: "You must be logged in to save campaigns.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        try {
            const adData: AdRecord = {
                userId: session.user.email,
                campaign: campaignName,
                placement,
                type: "text-dialogue",
                assets: {}, // No external images needed for this format yet
                settings: {
                    campaignName,
                    lines,
                    placement,
                    manualTargetId,
                    audioUrl
                },
                cpm,
                budget,
                status: initialData?.status || "active"
            }

            console.log("Saving Text-Dialogue record to DB...", adData)
            const adId = await saveAdRecord(adData, initialData?.userId ? (initialData as any).id || (initialData as any).docId : undefined)
            console.log("Dialogue Save successful! ID:", adId)

            const origin = window.location.origin
            const targetDivId = placement === "manual" ? manualTargetId.replace(/^#/, "") : placement

            const code = `<!-- Adelia Text-Dialogue Ad -->
<div id="${targetDivId}"></div>
<script src="${origin}/adpilot.js?id=${session.user.email}" async></script>`

            setEmbedScript(code)
            toast({ title: "Campaign Saved!", description: "Your AI Text-Dialogue campaign is now live." })
        } catch (err) {
            console.error("Text-Dialogue Save failed", err)
            toast({ title: "Save Failed", description: "Could not save. Check console for details.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                {/* Left Column: Editor (5/12) */}
                <aside className="md:col-span-5 space-y-6">
                    <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <MessagesSquare className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Text Dialogue Builder</CardTitle>
                                    <CardDescription>Create AI-powered native conversations</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 p-1 h-11">
                                    <TabsTrigger value="dialogue" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                        Dialogue
                                    </TabsTrigger>
                                    <TabsTrigger value="voices" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                        Voices
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="dialogue" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="campaignName" className="text-white/60 text-xs">Campaign Name</Label>
                                        <Input
                                            id="campaignName"
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                            placeholder="Enter campaign name..."
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {lines.map((line, index) => (
                                            <div key={line.id} className={cn(
                                                "p-4 rounded-2xl border transition-all duration-300",
                                                line.speaker === "A" ? "bg-indigo-500/10 border-indigo-500/30 ml-0 mr-8" : "bg-emerald-500/10 border-emerald-500/30 ml-8 mr-0"
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge variant={line.speaker === "A" ? "default" : "secondary"} className={cn(
                                                        "text-[10px] px-1.5 h-5",
                                                        line.speaker === "A" ? "bg-indigo-600" : "bg-emerald-600"
                                                    )}>
                                                        Speaker {line.speaker}
                                                    </Badge>
                                                    <Button size="icon" variant="ghost" onClick={() => handleRemoveLine(line.id)} className="h-6 w-6 text-white/40 hover:text-red-400">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    value={line.text}
                                                    onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                                                    placeholder={`Line for Speaker ${line.speaker}...`}
                                                    className="bg-transparent border-none p-0 text-sm focus-visible:ring-0 placeholder:text-white/20 h-auto min-h-[40px]"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleAddLine}
                                        variant="outline"
                                        className="w-full border-dashed border-white/10 bg-transparent hover:bg-white/5 gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Add Dialogue Line
                                    </Button>
                                </TabsContent>

                                <TabsContent value="voices" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                                            <Label className="text-white/60 text-xs mb-3 block">Speaker A Voice (Spanish LatAm)</Label>
                                            <Select
                                                value={lines.find(l => l.speaker === "A")?.voiceId || SPANISH_LATIN_VOICES[0].id}
                                                onValueChange={(val) => handleUpdateSpeakerVoice("A", val)}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue placeholder="Select Voice" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    {SPANISH_LATIN_VOICES.map(voice => (
                                                        <SelectItem key={voice.id} value={voice.id} className="hover:bg-indigo-600">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{voice.name}</span>
                                                                <span className="text-[10px] text-white/40">{voice.description}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                            <Label className="text-white/60 text-xs mb-3 block">Speaker B Voice (Spanish LatAm)</Label>
                                            <Select
                                                value={lines.find(l => l.speaker === "B")?.voiceId || SPANISH_LATIN_VOICES[1].id}
                                                onValueChange={(val) => handleUpdateSpeakerVoice("B", val)}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue placeholder="Select Voice" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    {SPANISH_LATIN_VOICES.map(voice => (
                                                        <SelectItem key={voice.id} value={voice.id} className="hover:bg-emerald-600">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{voice.name}</span>
                                                                <span className="text-[10px] text-white/40">{voice.description}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                        <p className="text-[11px] text-amber-400 flex gap-2">
                                            <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                                            ElevenLabs Eleven v3 model provides highly emotional and natural Latin American Spanish delivery.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>

                        <div className="p-4 border-t border-white/5 space-y-4">
                            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <SlotSelector
                                    value={placement}
                                    onChange={(val, price) => {
                                        setPlacement(val)
                                        if (price) setCpm(price * 2)
                                    }}
                                />

                                {placement === "manual" && (
                                    <div className="space-y-2 text-sm">
                                        <Label className="text-white/60">HTML Container ID</Label>
                                        <Input
                                            value={manualTargetId}
                                            onChange={e => setManualTargetId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                                            placeholder="e.g. my-ad-root"
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-white/60">CPM ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={cpm}
                                            onChange={e => setCpm(parseFloat(e.target.value) || 0)}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/60">Budget ($)</Label>
                                        <Input
                                            type="number"
                                            value={budget}
                                            onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={isWorking} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                                    {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save & Export Script
                                </Button>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Right Column: Preview & Transcript (7/12) */}
                <div className="md:col-span-7 space-y-6">
                    <Card className="border-white/10 bg-black shadow-2xl overflow-hidden rounded-3xl h-[700px] flex flex-col relative group">
                        {/* Background Mesh */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-emerald-900/20 pointer-events-none" />

                        <CardHeader className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            isPlaying ? "bg-emerald-500 animate-pulse" : "bg-white/20"
                                        )} />
                                        Conversation Preview
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {isGenerating ? "Generating high-fidelity audio..." : "Testing ElevenLabs Dialogue Rendering"}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        disabled={isGenerating}
                                        onClick={handleTogglePlay}
                                        className={cn(
                                            "transition-all duration-300 min-w-[140px]",
                                            isPlaying ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" : "bg-emerald-600 hover:bg-emerald-700"
                                        )}
                                    >
                                        {isGenerating ? (
                                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                        ) : isPlaying ? (
                                            <Pause className="h-4 w-4 mr-2" />
                                        ) : (
                                            <Play className="h-4 w-4 mr-2" />
                                        )}
                                        {isGenerating ? "Generating..." : isPlaying ? "Stop" : audioUrl ? "Play Preview" : "Generate & Play"}
                                    </Button>

                                    {audioUrl && (
                                        <audio
                                            id="dialogue-audio"
                                            src={audioUrl}
                                            onEnded={() => setIsPlaying(false)}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                            className="hidden"
                                        />
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 relative overflow-hidden">
                            {/* Transcript Viewer / Conversation Component */}
                            <ScrollArea className="h-full p-8 pb-32">
                                <div className="space-y-6 max-w-md mx-auto">
                                    {lines.map((line, i) => (
                                        <div
                                            key={line.id}
                                            className={cn(
                                                "flex flex-col gap-1 transition-all duration-500",
                                                line.speaker === "A" ? "items-start" : "items-end",
                                                isPlaying && i === 1 ? "scale-105 opacity-100" : "opacity-80 hover:opacity-100" // Mock active state
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-lg",
                                                line.speaker === "A"
                                                    ? "bg-slate-800 text-white rounded-bl-none border border-white/5"
                                                    : "bg-indigo-600 text-white rounded-br-none"
                                            )}>
                                                {line.text || "..."}
                                            </div>
                                            <span className="text-[10px] text-white/30 uppercase tracking-widest px-1">
                                                Speaker {line.speaker} • {SPANISH_LATIN_VOICES.find(v => v.id === line.voiceId)?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Audio Visualizer Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-6 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center gap-2 z-20 overflow-hidden">
                                <div className="flex items-end gap-1 h-4">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-1 bg-indigo-400 rounded-full transition-all duration-300",
                                                isPlaying ? "animate-bounce" : "h-1"
                                            )}
                                            style={{ height: isPlaying ? `${Math.random() * 100}%` : '4px', animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                                <Volume2 className="h-4 w-4 text-white/60 ml-2" />
                            </div>
                        </CardContent>

                        {/* Premium Overlay Branding */}
                        <div className="absolute top-4 right-4 z-20 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-tighter rounded">
                                Enabled by ElevenLabs
                            </div>
                        </div>
                    </Card>
                    <div className="mt-6">
                        <AdScriptResult script={embedScript} />
                    </div>
                </div>
            </div>
        </div>
    )
}
