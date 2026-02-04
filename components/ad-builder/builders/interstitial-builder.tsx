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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Image as ImageIcon, Save, X, Timer, Copy } from "lucide-react"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { SlotSelector } from "@/components/ad-builder/slot-selector"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"

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

function generateInterstitialHtml(params: {
    bgUrl: string
    logoUrl: string
    headline: string
    body: string
    ctaText: string
    clickTag: string
    autoCloseSecs: number
    showTimer: boolean
}) {
    const safeClickTag = escapeHtmlAttr(params.clickTag)
    const safeHeadline = escapeHtmlAttr(params.headline)
    const safeBody = escapeHtmlAttr(params.body)
    const safeCta = escapeHtmlAttr(params.ctaText)

    return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Helvetica Neue', Arial, sans-serif; }
    #overlay {
      position: fixed;
      inset: 0;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    #bg {
      position: absolute;
      inset: 0;
      background-image: url('${params.bgUrl}');
      background-size: cover;
      background-position: center;
      opacity: 0.6;
      z-index: 1;
    }
    #content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
      max-width: 80%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #logo { max-width: 150px; margin-bottom: 30px; }
    #headline { font-size: 32px; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
    #body { font-size: 18px; margin-bottom: 40px; opacity: 0.9; }
    #cta {
      background: #e11d48;
      color: white;
      padding: 15px 40px;
      border-radius: 50px;
      font-weight: bold;
      font-size: 20px;
      text-decoration: none;
      transition: transform 0.2s;
      cursor: pointer;
    }
    #cta:hover { transform: scale(1.05); }
    #close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      background: rgba(0,0,0,0.5);
      width: 40px;
      height: 40px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 3;
      font-weight: bold;
      font-size: 20px;
    }
    #timer {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-size: 14px;
      z-index: 3;
    }
  </style>
</head>
<body>
  <div id="overlay">
    <div id="bg"></div>
    <div id="close-btn" onclick="closeAd()">×</div>
    ${params.showTimer ? `<div id="timer">Cerrando en <span id="secs">${params.autoCloseSecs}</span>s</div>` : ""}
    <div id="content">
      ${params.logoUrl ? `<img id="logo" src="${params.logoUrl}" alt="Logo">` : ""}
      <h1 id="headline">${safeHeadline}</h1>
      <p id="body">${safeBody}</p>
      <div id="cta" onclick="handleCta()">${safeCta}</div>
    </div>
  </div>

  <script>
    var autoClose = ${params.autoCloseSecs};
    var timerEl = document.getElementById('secs');

    function closeAd() {
      if (window.reportEvent) window.reportEvent('close');
      window.top.postMessage({ m: 'adelia', a: 'close_interstitial' }, '*');
      document.body.style.display = 'none';
    }

    function handleCta() {
      if (window.reportEvent) window.reportEvent('click');
      var urlParams = new URLSearchParams(window.location.search);
      var clickTag = urlParams.get("clickTag");
      var landing = "${safeClickTag}";
      if (clickTag) {
        window.open(clickTag + encodeURIComponent(landing), "_blank");
      } else {
        window.open(landing, "_blank");
      }
      closeAd();
    }

    if (autoClose > 0) {
      var interval = setInterval(function() {
        autoClose--;
        if (timerEl) timerEl.innerText = autoClose;
        if (autoClose <= 0) {
          clearInterval(interval);
          closeAd();
        }
      }, 1000);
    }
  </script>
</body>
</html>`
}

export function InterstitialBuilder({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // Form State
    const [campaign, setCampaign] = useState(initialData?.campaign ?? "My_Interstitial")
    const [placement, setPlacement] = useState(initialData?.placement ?? "Interstitial_Full")
    const [headline, setHeadline] = useState(initialData?.settings?.headline ?? "Oferta Exclusiva")
    const [body, setBody] = useState(initialData?.settings?.body ?? "No te pierdas de esta oportunidad unica por tiempo limitado.")
    const [ctaText, setCtaText] = useState(initialData?.settings?.ctaText ?? "Ver Mas")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url ?? "https://example.com")
    const [autoCloseSecs, setAutoCloseSecs] = useState(initialData?.settings?.autoClose ?? 10)
    const [showTimer, setShowTimer] = useState(initialData?.settings?.showTimer ?? true)

    // Assets
    const [bgUrl, setBgUrl] = useState(initialData?.assets?.background ?? "")
    const [logoUrl, setLogoUrl] = useState(initialData?.assets?.logo ?? "")

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")
    const [cpm, setCpm] = useState<number>(initialData?.cpm ?? 15.0)
    const [budget, setBudget] = useState<number>(initialData?.budget ?? 1000)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "background" | "logo") => {
        const file = e.target.files?.[0]
        if (!file || !session?.user?.email) return

        setIsWorking(true)
        try {
            const url = await uploadAdAsset(file, {
                userId: session.user.email,
                campaign: campaign || "interstitial-draft",
                fileName: `${type}_${file.name}`
            })
            if (type === "background") setBgUrl(url)
            else setLogoUrl(url)
            toast({ title: "Asset Uploaded", description: `${type} ready.` })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload asset.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const handleCopyScript = () => {
        navigator.clipboard.writeText(embedScript)
        toast({ title: "Copied!", description: "Embed script copied to clipboard." })
    }

    const handleExport = async () => {
        if (!bgUrl || !headline || !targetUrl) {
            toast({ title: "Missing Fields", description: "Background, Headline and URL are required.", variant: "destructive" })
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
            const htmlForCloud = generateInterstitialHtml({
                bgUrl: bgUrl, // Absolute URL
                logoUrl: logoUrl || "", // Absolute URL
                headline,
                body,
                ctaText,
                clickTag: targetUrl,
                autoCloseSecs,
                showTimer
            })

            // Inject Tracking
            const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);
            const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" });
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });

            await saveAdRecord({
                userId,
                campaign,
                placement,
                type: "interstitial-ad",
                assets: { background: bgUrl, logo: logoUrl },
                htmlUrl,
                settings: { headline, body, ctaText, url: targetUrl, autoClose: autoCloseSecs, showTimer },
                status: "active",
                cpm,
                budget
            }, docId)

            // Generate Embed Script
            const scriptCode = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${docId}";
  d.style.width = "300px";
  d.style.height = "600px"; 
  d.style.position = "relative";
  
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "300";
  f.height = "600";
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
        }
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">Interstitial Builder Settings</h2>
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
                        <div className="space-y-2">
                            <Label>Body Text</Label>
                            <Textarea value={body} onChange={e => setBody(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full-page Background</Label>
                                <Input type="file" onChange={e => handleFileUpload(e, "background")} accept="image/*" />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo Overlay</Label>
                                <Input type="file" onChange={e => handleFileUpload(e, "logo")} accept="image/*" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CTA Text</Label>
                                <Input value={ctaText} onChange={e => setCtaText(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Target URL</Label>
                                <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>Auto-close Timer</Label>
                                <p className="text-sm text-muted-foreground">Cierra el anuncio despues de X segundos</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    className="w-20"
                                    value={autoCloseSecs}
                                    onChange={e => setAutoCloseSecs(Number(e.target.value))}
                                />
                                <Switch checked={showTimer} onCheckedChange={setShowTimer} />
                            </div>
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
                {embedScript && (
                    <Card className="border-border bg-card p-6 border-emerald-500/50 bg-emerald-500/5 transition-all animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                                Ad Ready!
                            </h3>
                            <Button variant="outline" size="sm" onClick={handleCopyScript} className="gap-2">
                                <Copy className="h-4 w-4" /> Copy Script
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Copy and paste this script into your website to embed the ad.
                        </p>
                        <textarea
                            className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-background focus:ring-2 focus:ring-emerald-500"
                            readOnly
                            value={embedScript}
                        />
                    </Card>
                )}

                <Card className="border-border bg-card sticky top-24 overflow-hidden h-[600px] flex items-center justify-center bg-slate-100 dark:bg-neutral-900">
                    {/* Mock Phone/Screen */}
                    <div className="relative w-[300px] h-[550px] bg-black rounded-[40px] border-[8px] border-neutral-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute inset-0 z-0">
                            {bgUrl ? (
                                <img src={bgUrl} alt="Preview BG" className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white/20">BG Needed</div>
                            )}
                        </div>

                        <div className="absolute top-8 right-8 z-20 text-white text-2xl font-bold cursor-pointer">×</div>
                        {showTimer && <div className="absolute top-8 left-8 z-20 text-white/80 text-xs">Cerrando en {autoCloseSecs}s</div>}

                        <div className="relative z-10 p-6 text-center text-white flex flex-col items-center">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="max-h-[60px] mb-8" />}
                            <h3 className="text-2xl font-black mb-4 leading-tight">{headline}</h3>
                            <p className="text-sm opacity-80 mb-8">{body}</p>
                            <div className="px-8 py-3 bg-red-600 rounded-full font-bold text-lg shadow-lg">
                                {ctaText}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
