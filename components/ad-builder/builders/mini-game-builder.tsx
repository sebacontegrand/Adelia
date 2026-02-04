"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Upload, Save, Copy, Gamepad2, X, Plus, Monitor, Smartphone } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { type AdRecord, saveAdRecord } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SlotSelector } from "@/components/ad-builder/slot-selector"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"

// Helpers
function safeFileComponent(value: string) {
    return value.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
}

function generateGameHtml(params: {
    assets: string[],
    instruction: string,
    targetUrl: string,
    clickTag: string
}) {
    const safeInstruction = params.instruction.replace(/"/g, "&quot;")
    const safeTargetUrl = params.targetUrl.replace(/"/g, "&quot;")
    const safeClickTag = params.clickTag.replace(/"/g, "&quot;")

    // Create 6 cards (3 pairs)
    const cards = [...params.assets, ...params.assets]
        .map((src, i) => ({ id: i, src }))
        .sort(() => Math.random() - 0.5)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Match Ad</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; overflow: hidden; }
        #game-container { width: 300px; height: 400px; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .instruction { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 20px; text-align: center; line-height: 1.4; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; max-width: 240px; }
        .card { aspect-ratio: 1; background: #2563eb; border-radius: 6px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.4s; }
        .card.flipped { transform: rotateY(180deg); }
        .card.matched { visibility: hidden; opacity: 0; transition: opacity 0.3s, visibility 0.3s; }
        .card-face { position: absolute; inset: 0; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
        .card-front { background: #2563eb; color: white; border: 2px solid white; box-sizing: border-box; }
        .card-front::after { content: "?"; font-size: 24px; font-weight: bold; }
        .card-back { background: white; transform: rotateY(180deg); border: 1px solid #e2e8f0; }
        .card-back img { width: 80%; height: 80%; object-fit: contain; }
        
        #success-msg { display: none; text-align: center; animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .success-title { color: #059669; font-weight: bold; font-size: 18px; margin-bottom: 10px; }
        .cta-btn { display: inline-block; background: #2563eb; color: white; padding: 8px 20px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; }
    </style>
</head>
<body>
    <div id="game-container">
        <div id="game-view">
            <div class="instruction">${safeInstruction}</div>
            <div class="grid">
                ${cards.map(c => `
                    <div class="card" data-src="${c.src}" onclick="flipCard(this)">
                        <div class="card-face card-front"></div>
                        <div class="card-face card-back">
                            <img src="${c.src}" alt="icon">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div id="success-msg">
            <div class="success-title">Excellent!</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Content Unlocked</div>
            <a href="javascript:void(0)" class="cta-btn" onclick="handleClick()">Visit Site</a>
        </div>
    </div>

    <script>
        var urlParams = new URLSearchParams(window.location.search);
        var clickTag = urlParams.get("clickTag");
        var flipped = [];
        var matchedCount = 0;
        var totalPairs = 3;

        function flipCard(el) {
            if (flipped.length >= 2 || el.classList.contains('flipped') || el.classList.contains('matched')) return;
            
            el.classList.add('flipped');
            flipped.push(el);

            if (flipped.length === 2) {
                checkMatch();
            }
        }

        function checkMatch() {
            var c1 = flipped[0];
            var c2 = flipped[1];
            
            if (c1.dataset.src === c2.dataset.src) {
                setTimeout(function() {
                    c1.classList.add('matched');
                    c2.classList.add('matched');
                    matchedCount++;
                    flipped = [];
                    if (matchedCount === totalPairs) {
                        onWin();
                    }
                }, 600);
            } else {
                setTimeout(function() {
                    c1.classList.remove('flipped');
                    c2.classList.remove('flipped');
                    flipped = [];
                }, 1000);
            }
        }

        function onWin() {
            document.getElementById('game-view').style.display = 'none';
            document.getElementById('success-msg').style.display = 'block';
            
            // Report solve event
            if (window.reportEvent) window.reportEvent('solve');

            // Notify parent to unlock
            window.top.postMessage({ m: 'adelia', a: 'unlock_game_content' }, '*');
        }

        function handleClick() {
            if (window.reportEvent) window.reportEvent('click');
            var landing = "${safeTargetUrl}";
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

export function MiniGameBuilder({ initialData }: { initialData?: AdRecord & { id?: string } }) {
    const { toast } = useToast()
    const { data: session } = useSession()

    // Form State
    const [campaign, setCampaign] = useState(initialData?.campaign || "")
    const [placement, setPlacement] = useState(initialData?.placement || "")
    const [instruction, setInstruction] = useState(initialData?.settings?.instruction || "Match the icons to keep reading")
    const [targetUrl, setTargetUrl] = useState(initialData?.settings?.url || "")
    const [manualTargetId, setManualTargetId] = useState(initialData?.settings?.targetElementId || "")

    // Memory Game Assets (3 pairs required)
    const [assetUrls, setAssetUrls] = useState<string[]>(Array.isArray(initialData?.assets?.gameIcons) ? initialData.assets.gameIcons : [])

    // Pricing & Budget
    const [cpm, setCpm] = useState<number>(initialData?.cpm || 10.0)
    const [budget, setBudget] = useState<number>(initialData?.budget || 500)

    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")
    const [overlayMode, setOverlayMode] = useState(initialData?.settings?.overlayMode ?? false)

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (!session?.user?.email) {
            toast({ title: "Error", description: "Log in to upload files.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        try {
            const uploadedUrls: string[] = []
            for (let i = 0; i < files.length; i++) {
                const url = await uploadAdAsset(files[i], {
                    userId: session.user.email,
                    campaign: campaign || "minigame-draft",
                    fileName: `icon_${i}_${files[i].name}`
                })
                uploadedUrls.push(url)
            }
            setAssetUrls(prev => [...prev, ...uploadedUrls].slice(0, 3))
            toast({ title: "Icons Uploaded", description: `${uploadedUrls.length} icon(s) added.` })
        } catch (err) {
            console.error(err)
            toast({ title: "Error", description: "Failed to upload files.", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const removeAsset = (index: number) => {
        setAssetUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        console.log("MiniGameBuilder: Starting handleSave", { campaign, placement, assetCount: assetUrls.length, targetUrl });

        if (!campaign) {
            toast({ title: "Campaign Missing", description: "Please enter a campaign name.", variant: "destructive" })
            return
        }
        if (!placement) {
            toast({ title: "Slot Missing", description: "Please select a target slot.", variant: "destructive" })
            return
        }
        if (assetUrls.length < 3) {
            toast({ title: "Icons Missing", description: "3 icons are required for the memory game.", variant: "destructive" })
            return
        }
        if (!targetUrl) {
            toast({ title: "Target URL Missing", description: "Please enter a landing page URL.", variant: "destructive" })
            return
        }

        if (placement === "manual" && !manualTargetId) {
            toast({ title: "Target Missing", description: "Please provide a reference ID for manual placement.", variant: "destructive" })
            return
        }

        if (!session?.user?.email) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" })
            return
        }

        setIsWorking(true)
        setStatus("Generating ad...")
        setEmbedScript("")

        try {
            const userId = session.user.email
            const docId = initialData?.id || doc(collection(db, "ads")).id;
            console.log("MiniGameBuilder: Using docId", docId);

            const trackingOrigin = window.location.origin;
            const trackingCode = TRACKING_SCRIPT
                .replace("[[AD_ID]]", docId)
                .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

            console.log("MiniGameBuilder: Generating HTML...");
            const htmlForCloud = generateGameHtml({
                assets: assetUrls,
                instruction,
                targetUrl,
                clickTag: ""
            })

            const htmlContent = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);
            const htmlBlob = new Blob([htmlContent], { type: "text/html" });

            console.log("MiniGameBuilder: Uploading index.html...");
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });
            console.log("MiniGameBuilder: Uploaded HTML to", htmlUrl);

            const settings = {
                instruction,
                url: targetUrl,
                type: "mini-game-gated",
                targetElementId: placement === "manual" ? manualTargetId : "",
                overlayMode
            }

            console.log("MiniGameBuilder: Saving record to Firestore...");
            await saveAdRecord({
                userId,
                campaign,
                placement,
                type: "mini-game-gated",
                zipUrl: "-",
                assets: { gameIcons: assetUrls as any },
                htmlUrl,
                settings,
                cpm,
                budget,
                status: initialData?.status || "active"
            }, docId)

            const separator = htmlUrl.includes("?") ? "&" : "?";
            const script = `
<script>
(function() {
  var adId = "${docId}";
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var adUrl = "${htmlUrl}" + "${separator}" + "clickTag=" + encodeURIComponent(clickMacro);
  var isOverlay = ${overlayMode};
  
  var container = document.createElement("div");
  container.id = "ad_gated_" + adId;
  
  if (isOverlay) {
    // OVERLAY MODE: Fixed position takeover
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.zIndex = "2147483647";
    container.style.backgroundColor = "rgba(0,0,0,0.85)";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    
    // LOCK SCROLL
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    // INLINE MODE: Existing behavior
    container.style.width = "100%";
    container.style.maxWidth = "300px";
    container.style.height = "400px";
    container.style.margin = "30px auto";
    container.style.position = "relative";
    container.style.zIndex = "1000";
  }

  var iframe = document.createElement("iframe");
  iframe.src = adUrl;
  iframe.width = "300";
  iframe.height = "400";
  iframe.style.border = "none";
  iframe.style.display = "block";
  iframe.style.margin = "0 auto";
  iframe.scrolling = "no";
  iframe.style.borderRadius = "8px";
  iframe.style.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
  
  container.appendChild(iframe);
  
  // Logic based on mode
  if (!isOverlay) {
    var currentScript = document.currentScript;
    var parent = currentScript.parentNode;
    var nextElements = [];
    var sibling = currentScript.nextSibling;
    
    var wrapper = document.createElement("div");
    wrapper.id = "gated_content_" + adId;
    wrapper.style.transition = "filter 0.8s ease, opacity 0.8s ease";
    wrapper.style.filter = "blur(8px)";
    wrapper.style.opacity = "0.4";
    wrapper.style.pointerEvents = "none";
    wrapper.style.userSelect = "none";

    while (sibling) {
        nextElements.push(sibling);
        sibling = sibling.nextSibling;
    }
    nextElements.forEach(function(el) { wrapper.appendChild(el); });
    
    parent.insertBefore(container, null);
    parent.appendChild(wrapper);
  } else {
    document.body.appendChild(container);
  }

  // Listen for unlock
  window.addEventListener("message", function(e) {
      if (e.data && e.data.m === "adelia" && e.data.a === "unlock_game_content") {
          if (!isOverlay) {
              var wrapper = document.getElementById("gated_content_" + adId);
              if (wrapper) {
                wrapper.style.filter = "none";
                wrapper.style.opacity = "1";
                wrapper.style.pointerEvents = "auto";
                wrapper.style.userSelect = "auto";
              }
          } else {
              // RESTORE SCROLL
              document.body.style.overflow = '';
              document.documentElement.style.overflow = '';
          }
          
          setTimeout(() => {
             container.style.transition = "opacity 0.5s ease";
             container.style.opacity = "0";
             setTimeout(() => container.remove(), 500);
          }, 2000);
      }
  });

})();
</script>`

            console.log("MiniGameBuilder: Script generated successfully");
            setEmbedScript(script)
            setStatus("Success!")
            toast({ title: "Ad Created", description: "The gated content script has been generated." })
        } catch (err: any) {
            console.error("MiniGameBuilder: Error in handleSave", err);
            toast({ title: "Error", description: err.message || "Failed to save ad", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const handleCopyScript = () => {
        navigator.clipboard.writeText(embedScript)
        toast({ title: "Copied", description: "Script copied to clipboard." })
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 relative">
            <div className="space-y-6">
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Mini-Game Settings</CardTitle>
                        <CardDescription>Create an interactive gate for your mobile content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>User Instruction</Label>
                            <Input
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                placeholder="E.g.: Solve the puzzle to keep reading"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Game Icons (Upload 3 PNG/JPG files)</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {assetUrls.map((url, i) => (
                                    <div key={i} className="relative w-16 h-16 border rounded bg-slate-50">
                                        <img src={url} alt={`icon-${i}`} className="w-full h-full object-contain p-1" />
                                        <button
                                            onClick={() => removeAsset(i)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {assetUrls.length < 3 && (
                                    <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-slate-50">
                                        <Plus className="h-6 w-6 text-slate-400" />
                                        <input type="file" multiple className="hidden" onChange={handleAssetUpload} accept="image/*" />
                                    </label>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Icons will be duplicated to create 3 matching pairs.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Target URL (Game End)</Label>
                            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://..." />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        {overlayMode ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                                        {overlayMode ? "Overlay Mode (Desktop Focus)" : "Inline Mode (Mobile Focus)"}
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground">
                                        {overlayMode
                                            ? "Stops scrolling and centers the game on screen (Takeover)."
                                            : "Blurs content below the ad container inline."}
                                    </p>
                                </div>
                                <Switch
                                    checked={overlayMode}
                                    onCheckedChange={setOverlayMode}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader><CardTitle>Campaign Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Campaign Name</Label>
                            <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="Gated Mini-Game Launch" />
                        </div>

                        <SlotSelector
                            value={placement}
                            onChange={(val, price) => {
                                setPlacement(val)
                                if (price) setCpm(price * 2) // High interaction = High CPM
                            }}
                        />

                        {placement === "manual" && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-md border">
                                <Label>Reference Container ID</Label>
                                <Input
                                    value={manualTargetId}
                                    onChange={e => setManualTargetId(e.target.value)}
                                    placeholder="e.g. article-body"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>CPM ($)</Label>
                                <Input type="number" step="0.01" value={cpm} onChange={e => setCpm(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Budget ($)</Label>
                                <Input type="number" step="1" value={budget} onChange={e => setBudget(parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSave}
                            disabled={isWorking || !campaign || assetUrls.length < 3}
                        >
                            {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isWorking ? (status || "Working...") : "Save & Generate Script"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {embedScript && (
                    <Card className="p-4 bg-emerald-500/5 border-emerald-500/50 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-4">
                            <Label className="text-emerald-600 font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4" /> Interactive Gate Ready!
                                </span>
                                <Button variant="ghost" size="sm" onClick={handleCopyScript} className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                                    <Copy className="h-4 w-4 mr-2" /> Copy
                                </Button>
                            </Label>

                            <textarea
                                className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-slate-950 text-slate-50 focus:ring-2 focus:ring-emerald-500 resize-none"
                                readOnly
                                value={embedScript}
                            />

                            <p className="text-[10px] text-muted-foreground">
                                Paste this script at the exact point in your article where you want the content gating to begin.
                            </p>
                        </div>
                    </Card>
                )}

                <div className="sticky top-24 space-y-4">
                    <Label>Content Gate Preview</Label>
                    <div className="border rounded-lg bg-white overflow-hidden shadow-sm max-w-[320px] mx-auto">
                        <div className="p-4 space-y-3 opacity-30 select-none">
                            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                            <div className="h-4 w-full bg-slate-100 rounded"></div>
                        </div>

                        <div className="p-4 bg-slate-50 border-y flex items-center justify-center min-h-[400px]">
                            {assetUrls.length >= 3 ? (
                                <iframe
                                    srcDoc={generateGameHtml({ assets: assetUrls, instruction, targetUrl: "#", clickTag: "" })}
                                    style={{ width: '300px', height: '400px', border: 'none' }}
                                    scrolling="no"
                                />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Upload 3 icons to preview the game</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-3 blur-[3px] opacity-20 select-none">
                            <div className="h-4 w-full bg-slate-100 rounded"></div>
                            <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                            <div className="h-4 w-full bg-slate-100 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
