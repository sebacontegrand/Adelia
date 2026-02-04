"use client"

import type React from "react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, Save, Copy, Image as ImageIcon } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { SlotSelector } from "@/components/ad-builder/slot-selector"

function safeFileComponent(value: string) {
    return value.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
}

function generateSkinHtml(params: {
    bgUrl: string
    clickTag: string
}) {
    return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #skin-container {
      position: fixed;
      inset: 0;
      background-image: url('${params.bgUrl}');
      background-size: cover;
      background-position: center top;
      background-attachment: fixed;
      cursor: pointer;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div id="skin-container" onclick="handleClick()"></div>
  <script>
    function handleClick() {
      if (window.reportEvent) window.reportEvent('click');
      var urlParams = new URLSearchParams(window.location.search);
      var clickTag = urlParams.get("clickTag");
      var landing = "${params.clickTag}";
      if (clickTag) {
        window.open(clickTag + encodeURIComponent(landing), "_blank");
      } else {
        window.open(landing, "_blank");
      }
    }
  </script>
</body>
</html>`
}

export function SkinBuilder({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    const [campaign, setCampaign] = useState(initialData?.campaign ?? "Desktop_Wallpaper_Skin")
    const [placement, setPlacement] = useState(initialData?.placement ?? "skin_default")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url ?? "https://example.com")
    const [bgUrl, setBgUrl] = useState(initialData?.assets?.background ?? "")

    const [cpm, setCpm] = useState<number>(initialData?.cpm ?? 12.0)
    const [budget, setBudget] = useState<number>(initialData?.budget ?? 800)

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !session?.user?.email) return

        setIsWorking(true)
        setStatus("Uploading background...")
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "skin-draft",
                fileName: `skin_bg_${file.name}`
            })
            setBgUrl(url)
            toast({ title: "Background Uploaded", description: "Skin background ready." })
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
            toast({ title: "Missing Fields", description: "Background and Target URL are required.", variant: "destructive" })
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

            const htmlForCloud = generateSkinHtml({
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
                type: "desktop-skin",
                assets: { background: bgUrl },
                htmlUrl,
                settings: { url: targetUrl },
                status: "active",
                cpm,
                budget
            }, docId)

            const scriptCode = `<script>
(function() {
  // Inject Skin Styles to Parent
  var style = document.createElement('style');
  style.innerHTML = 'body { background-image: url("${bgUrl}"); background-attachment: fixed; background-position: center top; background-size: cover; cursor: pointer; }';
  document.head.appendChild(style);

  var clickMacro = "%%CLICK_URL_UNESC%%";

  // Click handler for body
  document.body.addEventListener('click', function(e) {
    if (e.target === document.body) {
      window.open(clickMacro + encodeURIComponent("${targetUrl}"), "_blank");
    }
  });

  // Tracking iframe (invisible)
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "1";
  f.height = "1";
  f.style.display = "none";
  document.body.appendChild(f);
})();
</script>`
            setEmbedScript(scriptCode)
            toast({ title: "Success", description: "Skin ad saved and script generated." })
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
                    <h2 className="text-xl font-bold mb-4">Desktop Wallpaper Skin Settings</h2>
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
                            <Label>Background Image (Wallpaper)</Label>
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
                            className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-slate-950 text-slate-50"
                            readOnly
                            value={embedScript}
                        />
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card className="border-border bg-card sticky top-24 overflow-hidden aspect-video flex flex-col items-center justify-center bg-slate-100 dark:bg-neutral-900 border-dashed border-2">
                    <div className="text-center p-8">
                        <div className="mb-4 inline-flex p-4 rounded-full bg-blue-500/10 text-blue-500">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg">Desktop Skin Preview</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            The wallpaper will occupy the margins of the publisher's site.
                        </p>
                    </div>
                    {bgUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={bgUrl} alt="Preview" className="w-full h-full object-cover opacity-40" />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
