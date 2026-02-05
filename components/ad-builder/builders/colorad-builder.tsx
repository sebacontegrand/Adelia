"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, Copy, Save } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { type AdRecord, saveAdRecord, getUserProfile, type UserProfile } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SourceInfo = {
  file: File
  bytes: number
}

function safeFileComponent(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80)
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function getFileExtension(fileName: string, fallback: string) {
  const dotIndex = fileName.lastIndexOf(".")
  return dotIndex > 0 ? fileName.slice(dotIndex) : fallback
}

async function createZipBlob(zipName: string, files: { name: string; data: string | Blob }[]) {
  const zip = new JSZip()
  for (const f of files) zip.file(f.name, f.data)
  return await zip.generateAsync({ type: "blob" })
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function buildColorAdHtml(params: {
  width: number
  height: number
  backgroundColor: string
  logoImage: string
  bwImage: string
  colorImage: string
  ctaUrl: string
  brandLabel: string
  brandName: string
}) {
  const safeBackgroundColor = escapeHtmlAttr(params.backgroundColor)
  const safeLogoImage = escapeHtmlAttr(params.logoImage)
  const safeBwImage = escapeHtmlAttr(params.bwImage)
  const safeColorImage = escapeHtmlAttr(params.colorImage)
  const safeCtaUrl = escapeHtmlAttr(params.ctaUrl)
  const safeBrandLabel = escapeHtmlAttr(params.brandLabel)
  const safeBrandName = escapeHtmlAttr(params.brandName)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>300x250 Reaction Game - Color Click</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body { font-family: Arial, sans-serif; }

  .banner {
    position: relative;
    width: ${params.width}px;
    height: ${params.height}px;
    background: #f5f5f5;
    color: #111827;
    overflow: hidden;
  }

  .top-bar {
    height: 42px;
    padding: 6px 10px;
    background: ${safeBackgroundColor};
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fff;
  }

  .brand-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: contain;
    background: #fff;
    padding: 2px;
  }

  .brand-texts {
    flex: 1;
    min-width: 0;
  }

  .brand-label {
    font-size: 9px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .brand-name {
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main {
    position: absolute;
    top: 42px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px 10px 5px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .headline {
    font-size: 12px;
    font-weight: 600;
  }

  .subheadline {
    font-size: 10px;
    opacity: 0.9;
    margin-bottom: 4px;
  }

  .game-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .image-box {
    position: relative;
    width: 90%;
    height: 60%;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
  }

  .image-inner {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transition: transform 0.08s ease;
  }

  .image-box:active .image-inner {
    transform: scale(0.98);
  }

  .status-badge {
    position: absolute;
    top: 6px;
    left: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 9px;
    background: rgba(15,23,42,0.78);
    color: #e5e7eb;
  }

  .status-badge.ok {
    color: #bbf7d0;
  }

  .status-badge.no {
    color: #fed7aa;
  }

  .bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .stats {
    font-size: 10px;
    opacity: 0.9;
  }

  .cta {
    display: inline-block;
    padding: 4px 10px;
    background: ${safeBackgroundColor};
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    text-decoration: none;
  }

  .cta:hover {
    opacity: 0.9;
  }

  .start-btn {
    display: inline-block;
    padding: 3px 10px;
    background: ${safeBackgroundColor};
    border-radius: 999px;
    font-size: 10px;
    font-weight: 500;
    color: white;
    text-decoration: none;
    cursor: pointer;
    border: none;
    margin-top: 2px;
  }

  .start-btn:hover {
    opacity: 0.9;
  }

  .message {
    font-size: 10px;
    opacity: 0.9;
    margin-top: 2px;
    min-height: 12px;
  }

  .win-overlay {
    position: absolute;
    inset: 42px 0 0 0;
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .win-overlay.active {
    display: flex;
  }

  .win-box {
    pointer-events: auto;
    background: rgba(15,23,42,0.98);
    border-radius: 14px;
    padding: 14px 16px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    max-width: 250px;
    color: #f9fafb;
  }

  .win-title {
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .win-text {
    font-size: 11px;
    margin-bottom: 10px;
    opacity: 0.95;
  }

  .win-cta {
    display: inline-block;
    padding: 5px 14px;
    background: ${safeBackgroundColor};
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    color: #0b1120;
    text-decoration: none;
  }

  .win-cta:hover {
    opacity: 0.95;
  }

  /* Shared button reset for cta/win-cta if converted to button */
  .cta, .win-cta {
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
</style>
<script>
  var urlParams = new URLSearchParams(window.location.search);
  var clickTag = urlParams.get("clickTag");

  function exitClick(landingUrl) {
    if (window.reportEvent) window.reportEvent('click');
    if (clickTag) {
      window.open(clickTag + encodeURIComponent(landingUrl), "_blank");
    } else {
      window.open(landingUrl, "_blank");
    }
  }
</script>
</head>
<body>
<div class="banner">

  <div class="top-bar">
    <img class="brand-logo"
         src="${safeLogoImage}"
         alt="Logo" />
    <div class="brand-texts">
      <div class="brand-label">${safeBrandLabel}</div>
      <div class="brand-name">${safeBrandName}</div>
    </div>
  </div>

  <div class="main">
    <div>
      <div class="headline">Hacé clic solo cuando veas la imagen a color.</div>
      <button class="start-btn" id="startBtn" type="button">Empezar</button>
      <div class="message" id="messageLabel"></div>
    </div>

    <div class="game-area">
      <div class="image-box" id="imageBox">
        <div class="image-inner" id="imageInner"></div>
        <div class="status-badge" id="statusBadge">Presioná “Empezar”</div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="stats" id="statsLabel">Aciertos: 0 · Errores: 0</div>
      <button class="cta" onclick="exitClick('${safeCtaUrl}')">
        Ver más ›
      </button>
    </div>
  </div>

  <div class="win-overlay" id="winOverlay">
    <div class="win-box">
      <div class="win-title">¡Juego completado! 🎉</div>
      <div class="win-text">
        Clickeaste la imagen a color a tiempo.
        Conocé más sobre la serie 6E.
      </div>
      <button class="win-cta" onclick="exitClick('${safeCtaUrl}')">
        Ir al sitio
      </button>
    </div>
  </div>

</div>

<script>
(function() {
  var COLOR_IMAGE_URL = "${safeColorImage}";
  var BW_IMAGE_URL    = "${safeBwImage}";

  var imageInner   = document.getElementById('imageInner');
  var imageBox     = document.getElementById('imageBox');
  var statusBadge  = document.getElementById('statusBadge');
  var statsLabel   = document.getElementById('statsLabel');
  var messageLabel = document.getElementById('messageLabel');
  var startBtn     = document.getElementById('startBtn');
  var winOverlay   = document.getElementById('winOverlay');

  var isColor      = false;
  var intervalId   = null;
  var gameRunning  = false;
  var success      = 0;
  var fails        = 0;

  function setImageState(color) {
    isColor = color;
    imageInner.style.backgroundImage = 'url(\"' + (color ? COLOR_IMAGE_URL : BW_IMAGE_URL) + '\")';

    if (color) {
      statusBadge.textContent = "¡Ahora está a color, clic!";
      statusBadge.classList.add('ok');
      statusBadge.classList.remove('no');
    } else {
      statusBadge.textContent = "Blanco y negro: esperá…";
      statusBadge.classList.add('no');
      statusBadge.classList.remove('ok');
    }
  }

  function updateStats() {
    statsLabel.textContent = "Aciertos: " + success + " · Errores: " + fails;
  }

  function startGame() {
    success = 0;
    fails = 0;
    updateStats();
    messageLabel.textContent = "";
    winOverlay.classList.remove('active');

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    gameRunning = true;
    startBtn.textContent = "Reiniciar";

    setImageState(false);

    intervalId = setInterval(function() {
      setImageState(!isColor);
    }, 150);
  }

  function endGameWin() {
    gameRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    messageLabel.textContent = "¡Excelentes reflejos!";
    winOverlay.classList.add('active');
  }

  function endGameLose() {
    gameRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    messageLabel.textContent = "Te adelantaste. Probá de nuevo.";
  }

  imageInner.style.backgroundImage = 'url(\"' + BW_IMAGE_URL + '\")';

  startBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    startGame();
  });

  imageBox.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!gameRunning) return;

    if (isColor) {
      success++;
      updateStats();
      endGameWin();
    } else {
      fails++;
      updateStats();
      messageLabel.textContent = "Ups, era blanco y negro.";
      endGameLose();
    }
  });

})();
</script>
</body>
</html>`
}


export function ColorAdBuilder({ initialData }: { initialData?: AdRecord }) {
  const { toast } = useToast()
  const { data: session } = useSession()

  const [availableSlots, setAvailableSlots] = useState<UserProfile["availableSlots"]>([])

  const [campaign, setCampaign] = useState(initialData?.campaign ?? "")
  const [placement, setPlacement] = useState(initialData?.placement ?? "")
  const [targetElementId, setTargetElementId] = useState(initialData?.settings?.targetElementId ?? "")

  // Pricing & Budget
  const [cpm, setCpm] = useState<number>(initialData?.cpm || 5.0)
  const [budget, setBudget] = useState<number>(initialData?.budget || 100)

  const isAdmin = useMemo(() => {
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
    return session?.user?.email && adminEmails.includes(session.user.email)
  }, [session])

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
    if (targetElementId && targetElementId !== "none") {
      const selectedSlot = availableSlots.find(s => s.id === targetElementId)
      if (selectedSlot && selectedSlot.price) {
        setCpm(selectedSlot.price)
      }
    }
  }, [targetElementId, availableSlots])
  const [backgroundColor, setBackgroundColor] = useState(initialData?.settings?.background_color ?? "#63A105")
  const [ctaUrl, setCtaUrl] = useState(initialData?.settings?.cta_url ?? "https://www.cronista.com")
  const [brandLabel, setBrandLabel] = useState(initialData?.settings?.brandLabel ?? "JHON DEERE")
  const [brandName, setBrandName] = useState(initialData?.settings?.brandName ?? "Serie 6E")

  const [logoSource, setLogoSource] = useState<SourceInfo | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialData?.assets?.logo ?? "")
  const [bwSource, setBwSource] = useState<SourceInfo | null>(null)
  const [bwUrl, setBwUrl] = useState(initialData?.assets?.bw ?? "")
  const [colorSource, setColorSource] = useState<SourceInfo | null>(null)
  const [colorUrl, setColorUrl] = useState(initialData?.assets?.color ?? "")

  const [previewLogoUrl, setPreviewLogoUrl] = useState("")
  const [previewBwUrl, setPreviewBwUrl] = useState("")
  const [previewColorUrl, setPreviewColorUrl] = useState("")

  // Dimensions
  const [customWidth, setCustomWidth] = useState(initialData?.settings?.width ?? 300)
  const [customHeight, setCustomHeight] = useState(initialData?.settings?.height ?? 250)

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [embedScript, setEmbedScript] = useState("")

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const bwInputRef = useRef<HTMLInputElement | null>(null)
  const colorInputRef = useRef<HTMLInputElement | null>(null)

  const namingPrefix = useMemo(() => {
    const c = safeFileComponent(campaign)
    const p = safeFileComponent(placement)
    const prefix = [c, p].filter(Boolean).join("__")
    return prefix || "colorad"
  }, [campaign, placement])

  const zipName = `${namingPrefix}.zip`
  const logoFileName = logoSource ? `${namingPrefix}__logo${getFileExtension(logoSource.file.name, ".png")}` : ""
  const bwFileName = bwSource ? `${namingPrefix}__bw${getFileExtension(bwSource.file.name, ".jpg")}` : ""
  const colorFileName = colorSource ? `${namingPrefix}__color${getFileExtension(colorSource.file.name, ".jpg")}` : ""

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setLogoSource({ file: f, bytes: f.size })
    setPreviewLogoUrl(await fileToDataUrl(f))
    setStatus(`Logo: ${f.name}`)
  }

  const onBwChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setBwSource({ file: f, bytes: f.size })
    setPreviewBwUrl(await fileToDataUrl(f))
    setStatus(`Imagen ByN: ${f.name}`)
  }

  const onColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setColorSource({ file: f, bytes: f.size })
    setPreviewColorUrl(await fileToDataUrl(f))
    setStatus(`Imagen color: ${f.name}`)
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript)
    toast({ title: "Copied!", description: "Embed script copied to clipboard." })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStatus("")
    setEmbedScript("")

    if ((!logoSource && !logoUrl) || (!bwSource && !bwUrl) || (!colorSource && !colorUrl)) {
      setError("Subi logo, imagen ByN y imagen color para continuar.")
      return
    }

    if (!session?.user?.email) {
      setError("User authentication required.")
      return
    }
    const userId = session.user.email

    try {
      setIsWorking(true)

      const logoRef = logoSource ? logoFileName : logoUrl
      const bwRef = bwSource ? bwFileName : bwUrl
      const colorRef = colorSource ? colorFileName : colorUrl

      const html = buildColorAdHtml({
        width: customWidth,
        height: customHeight,
        backgroundColor,
        logoImage: logoRef,
        bwImage: bwRef,
        colorImage: colorRef,
        ctaUrl: ctaUrl.trim(),
        brandLabel,
        brandName,
      })

      setGeneratedHtml(html)

      const preview = buildColorAdHtml({
        width: customWidth,
        height: customHeight,
        backgroundColor,
        logoImage: previewLogoUrl || logoFileName,
        bwImage: previewBwUrl || bwFileName,
        colorImage: previewColorUrl || colorFileName,
        ctaUrl: ctaUrl.trim(),
        brandLabel,
        brandName,
      })
      setPreviewHtml(preview)

      const manifest = {
        format: "colorad",
        version: "1.0.0",
        generated_at: new Date().toISOString(),
        naming: {
          campaign,
          placement,
          zip_name: zipName,
          files: {
            logo: logoFileName,
            bw: bwFileName,
            color: colorFileName,
          },
        },
        settings: {
          background_color: backgroundColor,
          cta_url: ctaUrl.trim(),
          width: customWidth,
          height: customHeight,
          targetElementId
        },
        assets: {
          logo_upload: true,
          bw_upload: true,
          color_upload: true,
        },
      }

      const files: { name: string; data: string | Blob }[] = [
        { name: "index.html", data: html },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
      ]
      if (logoSource) files.push({ name: logoFileName, data: logoSource.file })
      if (bwSource) files.push({ name: bwFileName, data: bwSource.file })
      if (colorSource) files.push({ name: colorFileName, data: colorSource.file })

      const zipBlob = await createZipBlob(zipName, files)

      // 4. Upload to Firebase
      setStatus("Uploading assets to cloud...")

      let uploadedLogoUrl = logoUrl
      if (logoSource) {
        uploadedLogoUrl = await uploadAdAsset(logoSource.file, { userId, campaign, fileName: logoFileName })
      }

      let uploadedBwUrl = bwUrl
      if (bwSource) {
        uploadedBwUrl = await uploadAdAsset(bwSource.file, { userId, campaign, fileName: bwFileName })
      }

      let uploadedColorUrl = colorUrl
      if (colorSource) {
        uploadedColorUrl = await uploadAdAsset(colorSource.file, { userId, campaign, fileName: colorFileName })
      }

      const zipUrl = await uploadAdAsset(zipBlob, { userId, campaign, fileName: zipName })

      // 0. Generate ID early for Tracking
      const newAdRef = doc(collection(db, "ads"));
      const docId = newAdRef.id;
      const trackingOrigin = window.location.origin;
      const trackingCode = TRACKING_SCRIPT
        .replace("[[AD_ID]]", docId)
        .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

      // Generate Cloud HTML with Absolute URLs
      const htmlForCloud = buildColorAdHtml({
        width: customWidth,
        height: customHeight,
        backgroundColor,
        logoImage: uploadedLogoUrl,
        bwImage: uploadedBwUrl,
        colorImage: uploadedColorUrl,
        ctaUrl: ctaUrl.trim(),
        brandLabel,
        brandName,
      })

      // Inject Tracking
      const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);

      const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" })
      const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" })

      // 5. Save Record
      setStatus("Saving database record...")
      await saveAdRecord({
        userId,
        campaign,
        placement,
        type: "colorad",
        zipUrl,
        assets: {
          logo: uploadedLogoUrl,
          bw: uploadedBwUrl,
          color: uploadedColorUrl
        },
        htmlUrl,
        settings: manifest.settings,
        cpm,
        budget,
        status: initialData?.status || "active"
      }, docId)

      // 6. Generate Embed Script
      const scriptCode = `<script>
(function() {
  var d = document.createElement("div");
  d.id = "ad_container_${docId}";
  d.style.width = "${customWidth}px";
  d.style.height = "${customHeight}px"; 
  d.style.position = "relative";

  var clickMacro = "%%CLICK_URL_UNESC%%";
 
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "${customWidth}";
  f.height = "${customHeight}";
  f.style.border = "none";
  f.scrolling = "no";
  
  d.appendChild(f);
  document.currentScript.parentNode.insertBefore(d, document.currentScript);
})();
</script>`
      setEmbedScript(scriptCode)

      setStatus("Complete!")
      toast({ title: "Ad Saved!", description: "Assets uploaded and record created." })
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Error generating ZIP.")
      toast({ title: "Error", description: err?.message ?? "Error generating ZIP.", variant: "destructive" })
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
      <Card className="border-border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Campana (nombre)</Label>
            <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Ej: ACME_Q1_2026" />
          </div>

          <div className="space-y-2">
            <Label>Nombre del anuncio</Label>
            <Input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Ej: JD_300x250_colorad" />
          </div>

          <div className="space-y-2">
            <Label>Target Slot (Optional)</Label>
            {availableSlots.length > 0 ? (
              <Select value={targetElementId} onValueChange={setTargetElementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableSlots.map(slot => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.name} ({slot.format})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground border p-3 rounded-md">
                No slots found. Configure them in <a href="/media-kit-settings" target="_blank" className="underline text-blue-400">Media Kit Settings</a>.
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Select the slot where this ad will appear.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ancho (px)</Label>
              <Input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Alto (px)</Label>
              <Input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ZIP</span>
              <span className="font-mono">{zipName}</span>
            </div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="font-mono">index.html</div>
              <div className="font-mono">{logoFileName || "logo.png"}</div>
              <div className="font-mono">{bwFileName || "byn.png"}</div>
              <div className="font-mono">{colorFileName || "color.png"}</div>
              <div className="font-mono">manifest.json</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color de fondo (top bar + botones)</Label>
            <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>URL del sitio</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://www.tusitio.com" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Brand label</Label>
              <Input value={brandLabel} onChange={(e) => setBrandLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Brand name</Label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
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
              <p className="text-[10px] text-muted-foreground font-medium">Max spend for this ad.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo (subi imagen)</Label>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => logoInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {logoSource ? `Cargado: ${logoSource.file.name}` : "Subir logo"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Imagen Blanco y Negro</Label>
            <input ref={bwInputRef} type="file" accept="image/*" onChange={onBwChange} className="hidden" />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => bwInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {bwSource ? `Cargado: ${bwSource.file.name}` : "Subir imagen ByN"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Imagen a color</Label>
            <input ref={colorInputRef} type="file" accept="image/*" onChange={onColorChange} className="hidden" />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => colorInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {colorSource ? `Cargado: ${colorSource.file.name}` : "Subir imagen color"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          )}
          {status && <div className="rounded-md border bg-muted p-3 text-sm">{status}</div>}

          <Button type="submit" className="w-full" size="lg" disabled={isWorking}>
            <Save className="mr-2 h-4 w-4" />
            {isWorking ? "Procesando..." : "Generate and Save to Cloud"}
          </Button>
        </form>
      </Card>

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
              className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-slate-950 text-slate-50 focus:ring-2 focus:ring-emerald-500 resize-none"
              readOnly
              value={embedScript}
            />
          </Card>
        )}

        <Card className="border-border bg-card p-8 space-y-3">
          <Label>Preview (HTML)</Label>
          <div className="overflow-hidden rounded-md border">
            <iframe
              title="ColorAd preview"
              className="h-[260px] w-full bg-gray-600"
              sandbox="allow-scripts allow-popups"
              srcDoc={previewHtml || ""}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
