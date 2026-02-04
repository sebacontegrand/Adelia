"use client"

import type React from "react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Copy, View } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { SlotSelector } from "@/components/ad-builder/slot-selector"

function generateInterscrollerHtml(params: {
    bgUrl: string
    clickTag: string
}) {
    return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #scroller-bg {
      position: fixed;
      inset: 0;
      background-image: url('${params.bgUrl}');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    #trigger {
      width: 100%;
      height: 100vh;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="scroller-bg"></div>
  <div id="trigger" onclick="handleClick()"></div>
  
  <script>
    function handleClick() {
      if (window.reportEvent) window.reportEvent('click');
      window.open("${params.clickTag}", "_blank");
    }
  </script>
</body>
</html>`
}

export function InterscrollerBuilder({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    const [campaign, setCampaign] = useState(initialData?.campaign ?? "Desktop_Interscroller")
    const [placement, setPlacement] = useState(initialData?.placement ?? "interscroller_default")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url ?? "https://example.com")
    const [bgUrl, setBgUrl] = useState(initialData?.assets?.background ?? "")

    const [cpm, setCpm] = useState<number>(initialData?.cpm ?? 12.0)
    const [budget, setBudget] = useState<number>(initialData?.budget ?? 850)

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !session?.user?.email) return

        setIsWorking(true)
        setStatus("Uploading immersive asset...")
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "interscroller-draft",
                fileName: `interscroller_${file.name}`
            })
            setBgUrl(url)
            toast({ title: "Asset Uploaded", description: "Interscroller background ready." })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload asset.", variant: "destructive" })
        } finally {
            setIsWorking(false)
            setStatus("")
        }
    }

    const handleSave = async () => {
        if (!bgUrl || !targetUrl) {
            toast({ title: "Missing Fields", description: "Background asset and Target URL are required.", variant: "destructive" })
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

            const htmlForCloud = generateInterscrollerHtml({
                bgUrl,
                clickTag: targetUrl
            })

            const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);
            const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" });
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });

            await saveAdRecord({
                userId,
                campaign,
                placement,
                type: "interscroller-ad",
                assets: { background: bgUrl },
                htmlUrl,
                settings: { url: targetUrl },
                status: "active",
                cpm,
                budget
            }, docId)

            const scriptCode = `<script>
(function() {
  var container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '600px'; 
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.margin = '40px 0';

  var clickMacro = "%%CLICK_URL_UNESC%%";
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  
  var iframe = document.createElement('iframe');
  iframe.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.scrolling = 'no';
  
  container.appendChild(iframe);
  document.currentScript.parentNode.insertBefore(container, document.currentScript);
})();
</script>`
            setEmbedScript(scriptCode)
            toast({ title: "Success", description: "Interscroller saved and script generated." })
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
                    <h2 className="text-xl font-bold mb-4">Interscroller (Scroll-Reveal) Settings</h2>
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
                            <Label>High-Res Background (1920x1080 recommended)</Label>
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
                <Card className="border-border bg-card sticky top-24 overflow-hidden h-[600px] flex flex-col items-center justify-center bg-slate-100 dark:bg-neutral-900">
                    <div className="w-full max-w-md space-y-4 p-8">
                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-neutral-700 rounded" />
                        <div className="h-32 w-full bg-slate-200/50 dark:bg-neutral-800 rounded border-2 border-dashed flex items-center justify-center relative overflow-hidden">
                            {bgUrl ? (
                                <img src={bgUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            ) : (
                                <View className="h-8 w-8 text-slate-400" />
                            )}
                            <span className="relative z-10 text-xs font-bold text-slate-500">Interscroller Gap</span>
                        </div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-neutral-700 rounded" />
                        <div className="h-4 w-1/2 bg-slate-200 dark:bg-neutral-700 rounded" />
                    </div>
                </Card>
            </div>
        </div>
    )
}
