"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdRecord } from "@/firebase/firestore"
import { Button } from "@/components/ui/button"
import { Layout, Copy, Check, Code2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdManagementDialogProps {
    ad: AdRecord & { id: string }
}

export function AdManagementDialog({ ad }: AdManagementDialogProps) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    // Reconstruct the embed script
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const targetDivId = ad.placement === "manual" ? (ad.settings?.targetElementId || "ad-root") : ad.placement
    const embedScript = `<!-- Adelia Ad: ${ad.campaign} -->
<div id="${targetDivId}"></div>
<script src="${origin}/adpilot.js?id=${ad.userId}" async></script>`

    const handleCopy = () => {
        navigator.clipboard.writeText(embedScript)
        setCopied(true)
        toast({ title: "Copied!", description: "Embed script copied to clipboard." })
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" title="Manage Ad Settings" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    <Layout className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-slate-950 border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Code2 className="h-5 w-5 text-emerald-400" />
                            Ad Management {ad.type === 'vertical-gallery' ? 'Gallery' : ''}: {ad.campaign}
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            Technical configuration and deployment script for this campaign.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Builder Fields Section */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Configuration Data</h4>
                            <Card className="bg-white/5 border-white/10 overflow-hidden">
                                <ScrollArea className="h-[180px] w-full">
                                    <div className="p-4">
                                        <pre className="text-[11px] font-mono text-emerald-300/70 leading-relaxed whitespace-pre-wrap break-all">
                                            {JSON.stringify(ad.settings, null, 2)}
                                        </pre>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </div>

                        {/* Embed Script Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Deployment Script</h4>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-7 px-3 text-[10px] gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20"
                                >
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copied ? "Copied" : "Copy Build"}
                                </Button>
                            </div>
                            <Card className="bg-black/40 border-white/10 overflow-hidden">
                                <div className="p-4">
                                    <pre className="text-[11px] font-mono text-blue-300/90 whitespace-pre-wrap break-all leading-relaxed">
                                        {embedScript}
                                    </pre>
                                </div>
                            </Card>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-white/20 font-mono">
                            <span>UID: {ad.id}</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">{ad.type}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
