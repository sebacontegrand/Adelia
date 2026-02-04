"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import type React from "react"
import { useLanguage } from "@/app/context/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Download, Save, Copy, Upload, X } from "lucide-react"
import JSZip from "jszip"
import { saveAdRecord, type AdRecord, getUserProfile, type UserProfile } from "@/firebase/firestore"
import { uploadAdAsset } from "@/firebase/storage"
import { doc, collection } from "firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { useSession } from "next-auth/react"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScratchAdBuilderProps {
    initialData?: AdRecord
}

type SourceInfo = {
    file: File
    bytes: number
}

// Helpers
function safeFileComponent(value: string) {
    return value.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
}
function getFileExtension(fileName: string, fallback: string) {
    const dotIndex = fileName.lastIndexOf(".")
    return dotIndex > 0 ? fileName.slice(dotIndex) : fallback
}
async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export function ScratchAdBuilder({ initialData }: ScratchAdBuilderProps) {
    const { t } = useLanguage()
    const { toast } = useToast()
    const { data: session, status: sessionStatus } = useSession() // Check status too
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Inputs
    const [campaign, setCampaign] = useState(initialData?.campaign || "")
    const [placement, setPlacement] = useState(initialData?.placement || "")
    const [targetUrl, setTargetUrl] = useState(initialData?.targetUrl || "") // NEW: Clicktag URL
    const [scratchPercent, setScratchPercent] = useState<number>(50)

    // Pricing & Budget
    const [cpm, setCpm] = useState<number>(initialData?.cpm || 5.0)
    const [budget, setBudget] = useState<number>(initialData?.budget || 100)

    // Media State
    const [coverSource, setCoverSource] = useState<SourceInfo | null>(null)
    const [coverUrl, setCoverUrl] = useState(initialData?.assets?.coverImage || "")

    const [backSource, setBackSource] = useState<SourceInfo | null>(null)
    const [backUrl, setBackUrl] = useState(initialData?.assets?.backImage || "")

    const [previewCoverUrl, setPreviewCoverUrl] = useState("")
    const [previewBackUrl, setPreviewBackUrl] = useState("")

    // Status State
    const [isWorking, setIsWorking] = useState(false)
    const [status, setStatus] = useState("")
    const [embedScript, setEmbedScript] = useState("")
    const [availableSlots, setAvailableSlots] = useState<UserProfile["availableSlots"]>([])

    const isAdmin = useMemo(() => {
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
        return session?.user?.email && adminEmails.includes(session.user.email)
    }, [session])

    // Naming & Files
    const namingPrefix = useMemo(() => {
        const c = safeFileComponent(campaign)
        const p = safeFileComponent(placement)
        return [c, p].filter(Boolean).join("__") || "scratch_ad"
    }, [campaign, placement])

    const zipName = `${namingPrefix}.zip`
    const coverFileName = coverSource ? `${namingPrefix}__cover${getFileExtension(coverSource.file.name, ".jpg")}` : "cover.jpg"
    const backFileName = backSource ? `${namingPrefix}__back${getFileExtension(backSource.file.name, ".jpg")}` : "back.jpg"

    const finalCoverUrl = coverSource ? previewCoverUrl : coverUrl
    const finalBackUrl = backSource ? previewBackUrl : backUrl

    // Handlers
    const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setCoverSource({ file: f, bytes: f.size })
        setPreviewCoverUrl(await fileToDataUrl(f))
    }

    const onBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setBackSource({ file: f, bytes: f.size })
        setPreviewBackUrl(await fileToDataUrl(f))
    }

    useEffect(() => {
        if (session?.user?.email) {
            getUserProfile(session.user.email).then(profile => {
                if (profile?.availableSlots) {
                    setAvailableSlots(profile.availableSlots)
                }
            })
        }
    }, [session])

    // Price sync
    useEffect(() => {
        if (placement && placement !== "manual") {
            const slot = availableSlots.find(s => s.id === placement)
            if (slot && slot.price) {
                setCpm(slot.price)
            }
        }
    }, [placement, availableSlots])

    // Custom File Upload Component to match ImageUpload style but keep File access
    const FileUpload = ({
        label,
        files,
        onChange,
        previewUrl,
        onRemove
    }: {
        label: string,
        files: React.RefObject<HTMLInputElement>,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        previewUrl: string,
        onRemove: () => void
    }) => {
        const fileInputRef = useRef<HTMLInputElement>(null)

        const handleClick = () => {
            fileInputRef.current?.click()
        }

        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={onChange}
                    />

                    {previewUrl ? (
                        <div className="relative h-20 w-20 rounded-md overflow-hidden border border-slate-200 group">
                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                            <button
                                onClick={onRemove}
                                type="button"
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={handleClick}
                            className="h-20 w-20 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50 hover:bg-slate-100"
                        >
                            <Upload className="h-6 w-6 text-slate-400" />
                        </div>
                    )}

                    {!previewUrl && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClick}
                            size="sm"
                        >
                            Upload Image
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    function Loader2({ className }: { className?: string }) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        )
    }

    // Live Canvas Preview Logic
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !finalCoverUrl) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const imgCover = new Image()
        imgCover.crossOrigin = "anonymous"
        imgCover.src = finalCoverUrl

        imgCover.onload = () => {
            canvas.width = 300
            canvas.height = 250
            ctx.globalCompositeOperation = "source-over"
            ctx.drawImage(imgCover, 0, 0, 300, 250)
        }

        // Scratch Logic
        let isDrawing = false
        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect()
            // Improve scalar scaling if preview is scaled down
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            }
        }

        const draw = (e: any) => {
            if (!isDrawing) return
            e.preventDefault()
            const pos = getPos(e)
            ctx.globalCompositeOperation = "destination-out"
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2)
            ctx.fill()
        }

        const start = (e: any) => { isDrawing = true; draw(e) }
        const end = () => { isDrawing = false }

        canvas.addEventListener("mousedown", start)
        canvas.addEventListener("mousemove", draw)
        canvas.addEventListener("mouseup", end)
        canvas.addEventListener("touchstart", start, { passive: false })
        canvas.addEventListener("touchmove", draw, { passive: false })
        canvas.addEventListener("touchend", end)

        return () => {
            canvas.removeEventListener("mousedown", start)
            canvas.removeEventListener("mousemove", draw)
            canvas.removeEventListener("mouseup", end)
            canvas.removeEventListener("touchstart", start)
            canvas.removeEventListener("touchmove", draw)
            canvas.removeEventListener("touchend", end)
        }
    }, [finalCoverUrl])


    // Build HTML String
    const buildHTML = (cUrl: string, bUrl: string, tUrl: string, isCloud: boolean) => {
        // If local zip, urls are filenames. If cloud, urls are absolute.
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaign}</title>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; width: 300px; height: 250px; cursor: pointer; }
        #ad-link { display: block; width: 100%; height: 100%; text-decoration: none; }
        #container { position: relative; width: 300px; height: 250px; }
        #container { 
            background: url('${bUrl}') no-repeat center center; 
            background-size: cover; 
        }
        canvas { position: absolute; top: 0; left: 0; z-index: 2; touch-action: none; cursor: crosshair; }
        .cta-overlay { position: absolute; bottom: 10px; width: 100%; text-align: center; color: white; font-family: sans-serif; font-size: 14px; z-index: 10; pointer-events: none; text-shadow: 0 2px 4px rgba(0,0,0,0.8); transition: opacity 0.5s; }
        .hidden { opacity: 0; pointer-events: none; }
    </style>
</head>
<body>
    <a id="ad-link" href="${tUrl}" target="_blank" onclick="if(window.reportEvent) window.reportEvent('click')">
        <div id="container">
            <canvas id="sCanvas" width="300" height="250"></canvas>
            <div id="cta" class="cta-overlay">Scratch to Reveal!</div>
        </div>
    </a>
    <script>
        const canvas = document.getElementById('sCanvas');
        const cta = document.getElementById('cta');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = '${cUrl}';
        
        const threshold = ${scratchPercent}; 
        const totalPixels = 300 * 250;
        let isRevealed = false;

        img.onload = () => {
            ctx.drawImage(img, 0, 0, 300, 250);
        };

        let isDrawing = false;
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }
        function draw(e) {
            if (!isDrawing || isRevealed) return;
            e.preventDefault();
            e.stopPropagation();
            const pos = getPos(e);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.fill();
            checkProgress(); 
        }
        
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; draw(e); });
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', () => { isDrawing = false; });
        canvas.addEventListener('touchstart', (e) => { isDrawing = true; draw(e); }, {passive: false});
        canvas.addEventListener('touchmove', draw, {passive: false});
        window.addEventListener('touchend', () => { isDrawing = false; });

        function checkProgress() {
            if (isRevealed || Math.random() > 0.1) return;
            try {
                const imageData = ctx.getImageData(0, 0, 300, 250);
                let clearPixels = 0;
                for (let i = 3; i < imageData.data.length; i += 4) {
                    if (imageData.data[i] === 0) clearPixels++;
                }
                if ((clearPixels / totalPixels) * 100 > threshold) {
                    revealAll();
                }
            } catch(e) { console.log("CORS issues with getImageData may occur locally"); }
        }

        function revealAll() {
            if (isRevealed) return;
            isRevealed = true;
            canvas.style.transition = "opacity 0.5s";
            canvas.style.opacity = "0";
            cta.classList.add("hidden");
            setTimeout(() => {
                canvas.style.display = 'none';
                document.getElementById('ad-link').focus();
            }, 500);
        }
    </script>
</body>
</html>`
    }


    const handleSave = async () => {
        console.log("handleSave Triggered!");
        // ... (Logs preserved)
        // Check fields
        if (!session?.user?.email) {
            console.warn("Save blocked: No User");
            toast({ title: "Error", description: "Login required", variant: "destructive" })
            return
        }
        // Validation now includes targetUrl
        if (!campaign || !placement || !targetUrl || (!coverSource && !coverUrl) || (!backSource && !backUrl)) {
            console.warn("Save blocked: Incomplete Fields");
            toast({ title: t("Error"), description: "Please complete all fields (Campaign, Name, URL, Images).", variant: "destructive" })
            return
        }

        try {
            console.log("Starting Execution Phase...")
            setIsWorking(true)
            setStatus("Starting upload...")
            const userId = session.user.email

            // 1. Upload Images
            let finalCoverStr = coverUrl
            if (coverSource) {
                finalCoverStr = await uploadAdAsset(coverSource.file, { userId, campaign, fileName: coverFileName })
            }
            let finalBackStr = backUrl
            if (backSource) {
                finalBackStr = await uploadAdAsset(backSource.file, { userId, campaign, fileName: backFileName })
            }

            // 2. Create Zip
            const zip = new JSZip()
            if (coverSource) zip.file(coverFileName, coverSource.file)
            if (backSource) zip.file(backFileName, backSource.file)

            const localHtml = buildHTML(coverFileName, backFileName, targetUrl, false)
            zip.file("index.html", localHtml)

            const manifest = {
                name: campaign,
                width: 300,
                height: 250,
                type: "scratch-off",
                targetUrl: targetUrl
            }
            zip.file("manifest.json", JSON.stringify(manifest, null, 2))

            const zipBlob = await zip.generateAsync({ type: "blob" })
            const zipUrl = await uploadAdAsset(zipBlob, { userId, campaign, fileName: zipName })

            // 3. Generate Cloud HTML
            const cloudHtml = buildHTML(finalCoverStr, finalBackStr, targetUrl, true)

            // Inject Tracking
            const newAdRef = doc(collection(db, "ads"))
            const docId = newAdRef.id
            const trackingOrigin = window.location.origin
            const trackingCode = TRACKING_SCRIPT
                .replace("[[AD_ID]]", docId)
                .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`)

            const finalCloudHtml = cloudHtml.replace("</body>", `${trackingCode}\n</body>`)
            const htmlBlob = new Blob([finalCloudHtml], { type: "text/html" })
            const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" })

            // 4. Save Record
            await saveAdRecord({
                userId,
                campaign,
                placement,
                targetUrl, // Saved here
                type: "scratch-off-300",
                zipUrl,
                htmlUrl,
                assets: { coverImage: finalCoverStr, backImage: finalBackStr },
                settings: { scratchPercent },
                cpm,
                budget,
                status: initialData?.status || "active"
            }, docId)
            console.log("Firestore saved!")

            // 5. Generate Script
            const script = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${docId}";
  d.style.width = "300px";
  d.style.height = "250px"; 
  d.style.position = "relative";
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "300";
  f.height = "250";
  f.style.border = "none";
  f.scrolling = "no";
  d.appendChild(f);
  document.currentScript.parentNode.insertBefore(d, document.currentScript);
})();
</script>`
            setEmbedScript(script)
            setStatus("Done!")
            toast({ title: "Success", description: "Ad saved and script generated." })
            console.log("All done.")

        } catch (e: any) {
            console.error(e)
            toast({ title: "Error", description: e.message || "Unknown Error", variant: "destructive" })
        } finally {
            setIsWorking(false)
        }
    }

    const handleCopyScript = () => {
        navigator.clipboard.writeText(embedScript)
        toast({ title: "Copied", description: "Script copied to clipboard" })
    }

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="p-6 space-y-4 bg-card border-border">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("builder.campaign_name") || "Campaign Name"}</Label>
                            <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="Summer Promo" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Destination URL (Clicktag)</Label>
                        <Input
                            value={targetUrl}
                            onChange={e => setTargetUrl(e.target.value)}
                            placeholder="https://example.com/landing-page"
                            type="url"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Target Slot (Optional)</Label>
                        <Select value={placement} onValueChange={setPlacement}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a slot..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">-- Manual / Custom --</SelectItem>
                                {availableSlots.map(slot => (
                                    <SelectItem key={slot.id} value={slot.id}>
                                        {slot.name} ({slot.format})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Select the slot where this ad will appear.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label>CPM ($) {!isAdmin && "(Read Only)"}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={cpm}
                                onChange={e => setCpm(parseFloat(e.target.value) || 0)}
                                disabled={!isAdmin}
                                className={!isAdmin ? "bg-muted" : ""}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {isAdmin ? "Cost per 1,000 impressions." : "Price set by administrator."}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Total Budget ($)</Label>
                            <Input
                                type="number"
                                step="1"
                                value={budget}
                                onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-[10px] text-muted-foreground">Max spend for this ad.</p>
                        </div>
                    </div>

                    <FileUpload
                        label={t("builder.cover_image") || "Cover Image (Scratch Layer)"}
                        files={useRef(null)} // Not used but type safeguard
                        onChange={onCoverChange}
                        previewUrl={finalCoverUrl}
                        onRemove={() => {
                            setCoverSource(null);
                            setPreviewCoverUrl("");
                            setCoverUrl("");
                        }}
                    />

                    <FileUpload
                        label={t("builder.back_image") || "Back Image (Reveal Layer)"}
                        files={useRef(null)} // Not used but type safeguard
                        onChange={onBackChange}
                        previewUrl={finalBackUrl}
                        onRemove={() => {
                            setBackSource(null);
                            setPreviewBackUrl("");
                            setBackUrl("");
                        }}
                    />

                    <Button onClick={handleSave} disabled={isWorking} className="w-full">
                        {isWorking ? "Uploading & Generating..." : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save & Generate Script
                            </>
                        )}
                    </Button>
                </Card>
            </div>

            <div className="space-y-6">
                {/* MOVED EMBED SCRIPT HERE */}
                {embedScript && (
                    <Card className="p-4 bg-muted/50 border-border animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-2">
                            <Label className="text-green-600 font-bold flex items-center gap-2">
                                <Save className="h-4 w-4" /> Script Generated!
                            </Label>
                            <div className="flex gap-2">
                                <Input value={embedScript} readOnly className="font-mono text-xs bg-white" />
                                <Button size="icon" variant="outline" onClick={handleCopyScript}><Copy className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Copy this snippet and paste it into your publisher site.</p>
                        </div>
                    </Card>
                )}

                <Label>Live Preview (300x250)</Label>
                <div className="relative w-[300px] h-[250px] border border-slate-700 shadow-xl rounded overflow-hidden bg-black">
                    {/* Main Preview Container */}
                    <div className="absolute inset-0 bg-no-repeat bg-center bg-cover"
                        style={{ backgroundImage: finalBackUrl ? `url(${finalBackUrl})` : 'none' }}>
                    </div>
                    <canvas ref={canvasRef} className="absolute inset-0 z-10 cursor-crosshair touch-none" />

                    {!finalCoverUrl && !finalBackUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-0">
                            Start by uploading images
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
