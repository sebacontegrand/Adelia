"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Image as ImageIcon, Save, X, Copy } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { SlotSelector } from "@/components/ad-builder/slot-selector"
import { AdScriptResult } from "@/components/ad-builder/ad-script-result"

function escapeHtmlAttr(value: string) {
    return value.replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function safeFileComponent(value: string) {
    return value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 80)
}

function generateParallaxHtml(params: {
    width: number
    height: number
    bgUrl: string
    contentUrl: string
    headline: string
    ctaText: string
    parallaxSpeed: number
    clickTag: string
}) {
    const safeClickTag = escapeHtmlAttr(params.clickTag)
    const safeHeadline = escapeHtmlAttr(params.headline)
    const safeCta = escapeHtmlAttr(params.ctaText)

    return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ad.size" content="width=${params.width},height=${params.height}">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: Arial, sans-serif; }
    #ad-container { position: relative; width: ${params.width}px; height: ${params.height}px; overflow: hidden; cursor: pointer; background: #000; }
    #parallax-bg {
      position: absolute;
      top: -20%;
      left: 0;
      width: 100%;
      height: 140%;
      background-image: url('${params.bgUrl}');
      background-size: cover;
      background-position: center;
      transition: transform 0.1s ease-out;
      z-index: 1;
    }
    #content-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2;
      background: rgba(0,0,0,0.2);
    }
    #content-img {
      max-width: 80%;
      max-height: 50%;
      margin-bottom: 20px;
    }
    #headline {
      color: white;
      font-size: 24px;
      font-bold: true;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      margin-bottom: 20px;
      padding: 0 20px;
    }
    #cta {
      background: #fff;
      color: #000;
      padding: 10px 25px;
      border-radius: 5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div id="ad-container">
    <div id="parallax-bg"></div>
    <div id="content-overlay">
      ${params.contentUrl ? `<img id="content-img" src="${params.contentUrl}" alt="Logo">` : ""}
      <div id="headline">${safeHeadline}</div>
      <div id="cta">${safeCta}</div>
    </div>
  </div>

  <script>
    var adContainer = document.getElementById('ad-container');
    var bg = document.getElementById('parallax-bg');
    var speed = ${params.parallaxSpeed};
    var clickTag = "${safeClickTag}";

    window.addEventListener('message', function(e) {
      if (e.data && e.data.scrollPct !== undefined) {
        var offset = (e.data.scrollPct - 0.5) * 100 * speed;
        bg.style.transform = 'translateY(' + offset + 'px)';
      }
    });

    // Fallback for non-iframe scroll or testing
    window.addEventListener('mousemove', function(e) {
      var pct = e.clientY / window.innerHeight;
      var offset = (pct - 0.5) * 60 * speed;
      bg.style.transform = 'translateY(' + offset + 'px)';
    });

    var urlParams = new URLSearchParams(window.location.search);
    var clickTag = urlParams.get("clickTag");

    adContainer.addEventListener('click', function() {
      if (window.reportEvent) window.reportEvent('click');
      var landing = clickTag ? clickTag + encodeURIComponent("${safeClickTag}") : "${safeClickTag}";
      window.open(landing, '_blank');
    });
  </script>
</body>
</html>`
}

export function ParallaxBuilder({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // Form State
    const [campaign, setCampaign] = useState(initialData?.campaign ?? "My_Parallax_Campaign")
    const [placement, setPlacement] = useState(initialData?.placement ?? "Parallax_970x250")
    const [headline, setHeadline] = useState(initialData?.settings?.headline ?? "Tu marca en movimiento")
    const [ctaText, setCtaText] = useState(initialData?.settings?.ctaText ?? "Descubrir")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url ?? "https://example.com")
    const [parallaxSpeed, setParallaxSpeed] = useState(initialData?.settings?.parallaxSpeed ?? 0.5)
    const [scratchPercent, setScratchPercent] = useState(0); // Added for the new Slider

    // Assets
    const [bgUrl, setBgUrl] = useState(initialData?.assets?.background ?? "")
    const [contentUrl, setContentUrl] = useState(initialData?.assets?.content ?? "")

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")
    const [cpm, setCpm] = useState<number>(initialData?.cpm ?? 8.0)
    const [budget, setBudget] = useState<number>(initialData?.budget ?? 500)

    // isAdmin and slots loading are handled by SlotSelector or locally if needed

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "background" | "content") => {
        const file = e.target.files?.[0]
        if (!file || !session?.user?.email) return

        setIsWorking(true)
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "parallax-draft",
                fileName: `${type}_${file.name}`
            })
            if (type === "background") setBgUrl(url)
            else setContentUrl(url)
            toast({ title: "Asset Uploaded", description: `${type} ready.` })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload asset.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }


    const handleExport = async () => {
        if (!bgUrl || !headline || !targetUrl) {
            toast({ title: "Missing Fields", description: "Background and Headline are required.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        setStatus("Saving ad...")
        setEmbedScript("")
        try {
            // Save to Firebase
            const userId = session?.user?.email!

            // 0. Generate ID early for Tracking
            const newAdRef = doc(collection(db, "ads"));
            const docId = newAdRef.id;
            const trackingOrigin = window.location.origin;
            const trackingCode = TRACKING_SCRIPT
                .replace("[[AD_ID]]", docId)
                .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

            // Generate Cloud HTML with Absolute URLs
            const htmlForCloud = generateParallaxHtml({
                width: 970,
                height: 250,
                bgUrl: bgUrl, // Absolute URL
                contentUrl: contentUrl || "", // Absolute URL
                headline,
                ctaText,
                parallaxSpeed,
                clickTag: targetUrl
            })

            // Inject Tracking
            const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);
            const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" });
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });

            await saveAdRecord({
                userId,
                campaign,
                placement,
                type: "parallax-banner",
                assets: { background: bgUrl, content: contentUrl },
                htmlUrl,
                settings: { headline, ctaText, url: targetUrl, parallaxSpeed },
                status: "active",
                cpm,
                budget
            }, docId)

            // Generate Embed Script
            const scriptCode = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${docId}";
  d.style.width = "970px";
  d.style.height = "250px"; 
  d.style.position = "relative";
  
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "970";
  f.height = "250";
  f.style.border = "none";
  f.scrolling = "no";
  
  d.appendChild(f);
  document.currentScript.parentNode.insertBefore(d, document.currentScript);
})();
</script>`
            setEmbedScript(scriptCode)

            toast({ title: "Success", description: "Ad saved and script generated." })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to export.", variant: "destructive" })
        } finally {
            setIsWorking(false)
            setStatus("")
        }
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">Parallax Builder Settings</h2>
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
                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input value={headline} onChange={e => setHeadline(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Background Image</Label>
                                <Input type="file" onChange={e => handleFileUpload(e, "background")} accept="image/*" />
                            </div>
                            <div className="space-y-2">
                                <Label>Overlay Image (Optional)</Label>
                                <Input type="file" onChange={e => handleFileUpload(e, "content")} accept="image/*" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>CTA Text</Label>
                            <Slider value={[scratchPercent]} onValueChange={(v: number[]) => setScratchPercent(v[0])} max={100} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label>Target URL</Label>
                            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Parallax Intensity ({parallaxSpeed})</Label>
                            <Slider
                                value={[parallaxSpeed]}
                                min={0} max={1} step={0.1}
                                onValueChange={v => setParallaxSpeed(v[0])}
                            />
                        </div>
                        <Button className="w-full" size="lg" onClick={handleExport} disabled={isWorking}>
                            <Save className="mr-2 h-4 w-4" />
                            {isWorking ? status || "Working..." : "Save & Generate Script"}
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                {/* Embed Script Output */}
                <AdScriptResult script={embedScript} />

                <Card className="border-border bg-card sticky top-24 overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="font-bold">Live Preview (Simulation)</h3>
                        <p className="text-xs text-muted-foreground">Move your mouse over the ad to see the parallax effect.</p>
                    </div>
                    <div
                        className="relative h-[250px] w-full bg-black overflow-hidden group cursor-pointer"
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pct = (e.clientY - rect.top) / rect.height;
                            const bg = e.currentTarget.querySelector('.preview-bg') as HTMLElement;
                            if (bg) bg.style.transform = `translateY(${(pct - 0.5) * 40 * parallaxSpeed}px)`;
                        }}
                    >
                        <div
                            className="preview-bg absolute -top-[20%] left-0 w-full h-[140%] bg-cover bg-center transition-transform duration-100 ease-out"
                            style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : 'none' }}
                        />
                        {!bgUrl && <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-neutral-900">Background Image Required</div>}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10 p-6 text-center">
                            {contentUrl && <img src={contentUrl} className="max-h-[80px] mb-4 object-contain" alt="Overlay" />}
                            <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-4">{headline}</h2>
                            <div className="px-6 py-2 bg-white text-black font-bold uppercase tracking-wider rounded-sm text-sm">
                                {ctaText}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
