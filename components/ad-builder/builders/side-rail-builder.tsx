"use client"

import type React from "react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Copy, Layout } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { SlotSelector } from "@/components/ad-builder/slot-selector"

function generateSideRailHtml(params: {
    side: "left" | "right" | "both"
    railUrl: string
    clickTag: string
}) {
    return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    .rail {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 160px;
      background-image: url('${params.railUrl}');
      background-size: cover;
      background-position: center;
      cursor: pointer;
    }
    #left-rail { left: 0; }
    #right-rail { right: 0; }
  </style>
</head>
<body>
  ${params.side === "left" || params.side === "both" ? `<div id="left-rail" class="rail" onclick="handleClick()"></div>` : ""}
  ${params.side === "right" || params.side === "both" ? `<div id="right-rail" class="rail" onclick="handleClick()"></div>` : ""}
  
  <script>
    function handleClick() {
      if (window.reportEvent) window.reportEvent('click');
      window.open("${params.clickTag}", "_blank");
    }
  </script>
</body>
</html>`
}

export function SideRailBuilder({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    const [campaign, setCampaign] = useState(initialData?.campaign ?? "Desktop_Side_Rail")
    const [placement, setPlacement] = useState(initialData?.placement ?? "rail_default")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url ?? "https://example.com")
    const [railUrl, setRailUrl] = useState(initialData?.assets?.rail ?? "")
    const [side, setSide] = useState<"left" | "right" | "both">(initialData?.settings?.side ?? "right")

    const [cpm, setCpm] = useState<number>(initialData?.cpm ?? 10.0)
    const [budget, setBudget] = useState<number>(initialData?.budget ?? 600)

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !session?.user?.email) return

        setIsWorking(true)
        setStatus("Uploading rail asset...")
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "siderail-draft",
                fileName: `rail_${file.name}`
            })
            setRailUrl(url)
            toast({ title: "Asset Uploaded", description: "Rail creative ready." })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload asset.", variant: "destructive" })
        } finally {
            setIsWorking(false)
            setStatus("")
        }
    }

    const handleSave = async () => {
        if (!railUrl || !targetUrl) {
            toast({ title: "Missing Fields", description: "Creative asset and Target URL are required.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        setStatus("Saving ad...")
        setEmbedScript("")
        try {
            const userId = session?.user?.email!
            const newAdRef = doc(collection(db, "ads"));
            const docId = newAdRef.id;

            const trackingOrigin = window.location.origin;
            const trackingCode = TRACKING_SCRIPT
                .replace("[[AD_ID]]", docId)
                .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

            const htmlForCloud = generateSideRailHtml({
                side,
                railUrl,
                clickTag: targetUrl
            })

            const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);
            const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" });
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });

            await saveAdRecord({
                userId,
                campaign,
                placement,
                type: "side-rail",
                assets: { rail: railUrl },
                htmlUrl,
                settings: { url: targetUrl, side },
                status: "active",
                cpm,
                budget
            }, docId)

            const scriptCode = `<script>
(function() {
  // Inject Side Rails to Parent
  var injectRail = function(side, url) {
    var div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.bottom = '0';
    div.style.width = '160px'; // Standard rail width
    div.style[side] = '0';
    div.style.backgroundImage = 'url("' + url + '")';
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.style.cursor = 'pointer';
    div.style.zIndex = '9999';
    var clickMacro = "%%CLICK_URL_UNESC%%";
    div.onclick = function() { window.open(clickMacro + encodeURIComponent("${targetUrl}"), "_blank"); };
    document.body.appendChild(div);
  };

  if ("${side}" === "left" || "${side}" === "both") injectRail('left', "${railUrl}");
  if ("${side}" === "right" || "${side}" === "both") injectRail('right', "${railUrl}");

  // Tracking iframe
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var f = document.createElement("iframe");
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "1";
  f.height = "1";
  f.style.display = "none";
  document.body.appendChild(f);
})();
</script>`
            setEmbedScript(scriptCode)
            toast({ title: "Success", description: "Side-Rail saved and script generated." })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to save.", variant: "destructive" })
        } finally {
            setIsWorking(false)
            setStatus("")
        }
    }

    const handleCopyScript = () => {
        navigator.clipboard.writeText(embedScript)
        toast({ title: "Copied!", description: "Embed script copied to clipboard." })
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">Side-Rail Takeover Settings</h2>
                    <div className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Campaign Name</Label>
                                <Input value={campaign} onChange={e => setCampaign(e.target.value)} />
                            </div>

                            <SlotSelector
                                value={placement}
                                onChange={(val, price) => {
                                    setPlacement(val)
                                    if (price) setCpm(price)
                                }}
                            />

                            <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        <div className="space-y-2">
                            <Label>Rail Position</Label>
                            <Select value={side} onValueChange={(v: any) => setSide(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="left">Left Rail</SelectItem>
                                    <SelectItem value="right">Right Rail</SelectItem>
                                    <SelectItem value="both">Both Rails (Mirror)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Rail Image (e.g. 160x1050)</Label>
                            <Input type="file" onChange={handleFileUpload} accept="image/*" />
                        </div>
                        <div className="space-y-2">
                            <Label>Target URL</Label>
                            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                        </div>
                        <Button className="w-full" size="lg" onClick={handleSave} disabled={isWorking}>
                            <Save className="mr-2 h-4 w-4" />
                            {isWorking ? status || "Working..." : "Save & Generate Script"}
                        </Button>
                    </div>
                </Card>

                {embedScript && (
                    <Card className="border-border bg-card p-6 border-emerald-500/50 bg-emerald-500/5 transition-all animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-emerald-500">Ad Ready!</h3>
                            <Button variant="outline" size="sm" onClick={handleCopyScript} className="gap-2">
                                <Copy className="h-4 w-4" /> Copy Script
                            </Button>
                        </div>
                        <textarea
                            className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-background"
                            readOnly
                            value={embedScript}
                        />
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card className="border-border bg-card sticky top-24 overflow-hidden h-[600px] flex items-center justify-center bg-slate-200 dark:bg-neutral-800 border-dashed border-2">
                    <div className="relative w-[80%] h-[90%] bg-white dark:bg-neutral-900 border shadow-md flex flex-col p-4">
                        {/* Mock Content */}
                        <div className="h-6 w-1/2 bg-slate-200 dark:bg-neutral-700 rounded mb-4" />
                        <div className="space-y-2 mb-8">
                            <div className="h-4 w-full bg-slate-100 dark:bg-neutral-800 rounded" />
                            <div className="h-4 w-full bg-slate-100 dark:bg-neutral-800 rounded" />
                            <div className="h-4 w-2/3 bg-slate-100 dark:bg-neutral-800 rounded" />
                        </div>
                        <div className="h-32 w-full bg-slate-100 dark:bg-neutral-800 rounded" />

                        {/* Rails logic for preview */}
                        {(side === "left" || side === "both") && (
                            <div className="absolute top-0 bottom-0 -left-12 w-10 bg-blue-500/20 border-r border-blue-500/50 flex items-center justify-center">
                                {railUrl ? <img src={railUrl} className="w-full h-full object-cover" /> : <Layout className="h-4 w-4 text-blue-500" />}
                            </div>
                        )}
                        {(side === "right" || side === "both") && (
                            <div className="absolute top-0 bottom-0 -right-12 w-10 bg-blue-500/20 border-l border-blue-500/50 flex items-center justify-center">
                                {railUrl ? <img src={railUrl} className="w-full h-full object-cover" /> : <Layout className="h-4 w-4 text-blue-500" />}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
