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
import { type AdRecord, saveAdRecord, getUserProfile } from "@/firebase/firestore"
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

function buildPuzzleHtml(params: {
  width: number
  height: number
  brandLabel: string
  brandName: string
  headline: string
  ctaText: string
  ctaUrl: string
  winTitle: string
  winText: string
  winCtaText: string
  winCtaUrl: string
  backgroundImage: string
  logoImage: string
  accentColor: string
}) {
  const safeBrandLabel = escapeHtmlAttr(params.brandLabel)
  const safeBrandName = escapeHtmlAttr(params.brandName)
  const safeHeadline = escapeHtmlAttr(params.headline)
  const safeCtaText = escapeHtmlAttr(params.ctaText)
  const safeCtaUrl = escapeHtmlAttr(params.ctaUrl)
  const safeWinTitle = escapeHtmlAttr(params.winTitle)
  const safeWinText = escapeHtmlAttr(params.winText)
  const safeWinCtaText = escapeHtmlAttr(params.winCtaText)
  const safeWinCtaUrl = escapeHtmlAttr(params.winCtaUrl)

  const safeBackgroundImage = escapeHtmlAttr(params.backgroundImage)
  const safeLogoImage = escapeHtmlAttr(params.logoImage)

  const safeAccentColor = escapeHtmlAttr(params.accentColor)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }

  .banner {
    position: relative;
    width: ${params.width}px;
    height: ${params.height}px;
    background: #F1F3F5;
    color: #fff;
    overflow: hidden;
  }

  .top-bar {
    height: 40px;
    padding: 6px 10px;
    background: ${safeAccentColor};
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .brand-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: contain;
    background: #fff;
  }

  .brand-texts {
    flex: 1;
    min-width: 0;
  }

  .brand-name {
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-label {
    font-size: 9px;
    opacity: 0.8;
    text-transform: uppercase;
  }

  .main {
    position: absolute;
    top: 35px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: #000;
  }

  .headline {
    font-size: 12px;
    font-weight: 500;
  }

  .puzzle-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .puzzle-grid {
    position: relative;
    width: 240px;
    height: 180px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 1px;
    background: #F1F3F5;
    border-radius: 8px;
    overflow: hidden;
  }

  .tile {
    position: relative;
    cursor: pointer;
    background-image: url("${safeBackgroundImage}");
    background-size: 240px 180px;
    background-repeat: no-repeat;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .tile:hover {
    transform: scale(1.03);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.25);
  }

  .tile.selected {
    box-shadow: 0 0 0 2px ${safeAccentColor};
    transform: scale(1.04);
  }

  .bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .moves {
    font-size: 10px;
    opacity: 0.9;
  }

  .cta {
    display: inline-block;
    padding: 4px 10px;
    background: ${safeAccentColor};
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: #000;
    text-decoration: none;
  }

  .cta:hover {
    opacity: 0.9;
  }

  .win-overlay {
    position: absolute;
    inset: 40px 0 0 0;
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
    background: rgba(15,23,42,0.95);
    border-radius: 10px;
    padding: 12px 14px;
    text-align: center;
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    max-width: 260px;
  }

  .win-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .win-text {
    font-size: 11px;
    margin-bottom: 8px;
    opacity: 0.95;
  }

  .win-cta {
    display: inline-block;
    padding: 4px 10px;
    background: ${safeAccentColor};
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: #000;
    text-decoration: none;
    cursor: pointer;
    border: none;
  }
</style>
<script>
  var urlParams = new URLSearchParams(window.location.search);
  var clickTag = urlParams.get("clickTag"); // May be null or ""

  function exitClick(landingUrl) {
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
         alt="Logo cliente" />
    <div class="brand-texts">
      <div class="brand-label">${safeBrandLabel}</div>
      <div class="brand-name">${safeBrandName}</div>
    </div>
  </div>

  <div class="main">
    <div>
      <div class="headline">${safeHeadline}</div>
    </div>

    <div class="puzzle-wrapper">
      <div class="puzzle-grid" id="puzzleGrid"></div>
    </div>

    <div class="bottom-row">
      <div class="moves" id="movesLabel">Movimientos: 0</div>
      <button class="cta" onclick="exitClick('${safeCtaUrl}')">
        ${safeCtaText}
      </button>
    </div>
  </div>

  <div class="win-overlay" id="winOverlay">
    <div class="win-box">
      <div class="win-title">${safeWinTitle}</div>
      <div class="win-text">${safeWinText}</div>
      <button class="win-cta" onclick="exitClick('${safeWinCtaUrl}')">
        ${safeWinCtaText}
      </button>
    </div>
  </div>
</div>

<script>
(function() {
  var rows = 3;
  var cols = 3;
  var totalTiles = rows * cols;
  var correctOrder = [];
  var currentOrder = [];
  var selectedIndex = null;
  var moves = 0;

  var grid = document.getElementById('puzzleGrid');
  var movesLabel = document.getElementById('movesLabel');
  var winOverlay = document.getElementById('winOverlay');

  for (var i = 0; i < totalTiles; i++) {
    correctOrder.push(i);
    currentOrder.push(i);
  }

  function shuffle(array) {
    var a = array.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    var same = true;
    for (var k = 0; k < a.length; k++) {
      if (a[k] !== correctOrder[k]) {
        same = false;
        break;
      }
    }
    if (same) {
      return shuffle(array);
    }
    return a;
  }

  currentOrder = shuffle(currentOrder);

  function createTiles() {
    grid.innerHTML = '';
    for (var i = 0; i < totalTiles; i++) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.position = i;
      tile.dataset.piece = currentOrder[i];

      setTileBackground(tile, currentOrder[i]);
      tile.addEventListener('click', onTileClick);
      grid.appendChild(tile);
    }
  }

  function setTileBackground(tile, pieceIndex) {
    var col = pieceIndex % cols;
    var row = Math.floor(pieceIndex / cols);
    var tileWidth = ${params.width} / cols; // 240 / 3 = 80
    var tileHeight = (${params.height} - 70) / rows; // (250 - 70) / 3 = 60
    var x = -col * tileWidth;
    var y = -row * tileHeight;
    tile.style.backgroundPosition = x + 'px ' + y + 'px';
  }

  function onTileClick(e) {
    var tile = e.currentTarget;
    var posIndex = parseInt(tile.dataset.position, 10);

    if (selectedIndex === null) {
      selectedIndex = posIndex;
      tile.classList.add('selected');
    } else if (selectedIndex === posIndex) {
      tile.classList.remove('selected');
      selectedIndex = null;
    } else {
      var firstTile = grid.querySelector('.tile[data-position=\"' + selectedIndex + '\"]');
      var secondTile = tile;

      var firstPiece = parseInt(firstTile.dataset.piece, 10);
      var secondPiece = parseInt(secondTile.dataset.piece, 10);

      firstTile.dataset.piece = secondPiece;
      secondTile.dataset.piece = firstPiece;

      setTileBackground(firstTile, secondPiece);
      setTileBackground(secondTile, firstPiece);

      currentOrder[selectedIndex] = secondPiece;
      currentOrder[posIndex] = firstPiece;

      firstTile.classList.remove('selected');
      selectedIndex = null;

      moves++;
      movesLabel.textContent = 'Movimientos: ' + moves;

      checkWin();
    }
  }

  function checkWin() {
    for (var i = 0; i < totalTiles; i++) {
      if (currentOrder[i] !== correctOrder[i]) {
        return;
      }
    }
    winOverlay.classList.add('active');
  }

  createTiles();
})();
</script>
</body>
</html>`
}

async function fetchAssetBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch asset from URL")
  return await response.blob()
}

export function Puzzle300Builder({ initialData }: { initialData?: AdRecord }) {
  const { toast } = useToast()
  const { data: session } = useSession()

  const [availableSlots, setAvailableSlots] = useState<Array<{ id: string, name: string, format: string }>>([])

  useEffect(() => {
    if (session?.user?.email) {
      getUserProfile(session.user.email).then(profile => {
        if (profile?.availableSlots) {
          setAvailableSlots(profile.availableSlots)
        }
      })
    }
  }, [session])

  const [campaign, setCampaign] = useState(initialData?.campaign ?? "")
  const [placement, setPlacement] = useState(initialData?.placement ?? "")
  const [targetElementId, setTargetElementId] = useState(initialData?.settings?.targetElementId ?? "")

  const [brandLabel, setBrandLabel] = useState(initialData?.settings?.brandLabel ?? "Jhon Deere")
  const [brandName, setBrandName] = useState(initialData?.settings?.brandName ?? "Arma el Nuevo 830HP")
  const [headline, setHeadline] = useState(initialData?.settings?.headline ?? "Hace clic en dos piezas para intercambiarlas.")
  const [ctaText, setCtaText] = useState(initialData?.settings?.ctaText ?? "Ver mas >")
  const [ctaUrl, setCtaUrl] = useState(initialData?.settings?.cta_url ?? "https://www.cronista.com")
  const [winTitle, setWinTitle] = useState(initialData?.settings?.winTitle ?? "Puzzle completo!")
  const [winText, setWinText] = useState(initialData?.settings?.winText ?? "Conoce mas sobre el nuevo 830 HP.")
  const [winCtaText, setWinCtaText] = useState(initialData?.settings?.winCtaText ?? "Ir al sitio")
  const [winCtaUrl, setWinCtaUrl] = useState(initialData?.settings?.win_cta_url ?? "https://www.cronista.com")
  const [accentColor, setAccentColor] = useState(initialData?.settings?.accentColor ?? "rgba(99, 161, 5, 1)")

  // Dimensions
  const [customWidth, setCustomWidth] = useState(initialData?.settings?.width ?? 300)
  const [customHeight, setCustomHeight] = useState(initialData?.settings?.height ?? 250)

  const [backgroundSource, setBackgroundSource] = useState<SourceInfo | null>(null)
  const [backgroundUrl, setBackgroundUrl] = useState(initialData?.assets?.background ?? "")
  const [logoSource, setLogoSource] = useState<SourceInfo | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialData?.assets?.logo ?? "")
  const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState("")
  const [previewLogoUrl, setPreviewLogoUrl] = useState("")

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [embedScript, setEmbedScript] = useState("")

  const backgroundInputRef = useRef<HTMLInputElement | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const namingPrefix = useMemo(() => {
    const c = safeFileComponent(campaign)
    const p = safeFileComponent(placement)
    const prefix = [c, p].filter(Boolean).join("__")
    return prefix || "puzzle"
  }, [campaign, placement])

  const zipName = `${namingPrefix}.zip`
  const backgroundFileName = backgroundSource
    ? `${namingPrefix}__background${getFileExtension(backgroundSource.file.name, ".jpg")}`
    : ""
  const logoFileName = logoSource ? `${namingPrefix}__logo${getFileExtension(logoSource.file.name, ".png")}` : ""

  const onBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setBackgroundSource({ file: f, bytes: f.size })
    setPreviewBackgroundUrl(await fileToDataUrl(f))
    setStatus(`Background: ${f.name}`)
  }

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setLogoSource({ file: f, bytes: f.size })
    setPreviewLogoUrl(await fileToDataUrl(f))
    setStatus(`Logo: ${f.name}`)
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

    if (!logoSource && !logoUrl) {
      setError("Subi un logo para continuar.")
      return
    }

    if (!backgroundSource && !backgroundUrl.trim()) {
      setError("Subi una imagen de fondo o agrega un URL.")
      return
    }

    if (!session?.user?.email) {
      setError("User authentication required.")
      return
    }
    const userId = session.user.email

    try {
      setIsWorking(true)

      const backgroundImageRef = backgroundSource ? backgroundFileName : backgroundUrl.trim()
      const logoImageRef = logoSource ? logoFileName : logoUrl

      // 1. Generate HTML
      const html = buildPuzzleHtml({
        width: customWidth,
        height: customHeight,
        brandLabel,
        brandName,
        headline,
        ctaText,
        ctaUrl,
        winTitle,
        winText,
        winCtaText,
        winCtaUrl,
        backgroundImage: backgroundImageRef,
        logoImage: logoImageRef,
        accentColor,
      })

      setGeneratedHtml(html)

      const previewBackground = backgroundSource ? previewBackgroundUrl : backgroundUrl.trim()
      const previewLogo = previewLogoUrl || logoImageRef

      const preview = buildPuzzleHtml({
        width: customWidth,
        height: customHeight,
        brandLabel,
        brandName,
        headline,
        ctaText,
        ctaUrl,
        winTitle,
        winText,
        winCtaText,
        winCtaUrl,
        backgroundImage: previewBackground,
        logoImage: previewLogo,
        accentColor,
      })
      setPreviewHtml(preview)

      // 3. Create ZIP
      const manifest = {
        format: "puzzle-300",
        version: "1.0.0",
        generated_at: new Date().toISOString(),
        naming: {
          campaign,
          placement,
          zip_name: zipName,
          files: {
            // Manifest for ZIP uses filenames
            logo: logoFileName,
            background: backgroundSource ? backgroundFileName : "external_url"
          },
        },
        settings: {
          cta_url: ctaUrl,
          win_cta_url: winCtaUrl,
          width: customWidth,
          height: customHeight,
          targetElementId
        },
        assets: {
          background_upload: Boolean(backgroundSource),
          logo_upload: true,
        },
      }

      const files: { name: string; data: string | Blob }[] = [
        { name: "index.html", data: html }, // html here uses relative filenames if uploaded? 
        // Wait, current `html` const is built using `logoImageRef`.
        // `logoImageRef` = logoSource ? logoFileName : logoUrl.
        // So for ZIP, if we uploaded a file, it uses filename. Correct.
        // If we reused a URL, it uses URL. Javascript execution inside local HTML accessing external URL. 
        // This is usually fine for images if CORS allows or simple GET.
        // BUT if we want "Ver HTML" to work, we need ensuring it works.
        // The issue with Puzzle is less critical because if we reuse URL, it IS absolute.
        // BUT if we just uploaded a file, we used `logoFileName` (relative).
        // So `html` variable has relative paths. 
        // Viewing that HTML file in cloud (at `firebase/index.html`) will fail to find `logo.png` relative to it unless we also upload `logo.png` to the same flat directory (we might not be doing that, or paths might differ).
        // Actually `uploadAdAsset` uploads to `ads/{userId}/{campaign}/{fileName}`.
        // And we upload `index.html` to `ads/{userId}/{campaign}/index.html`.
        // So relative paths SHOULD work if the browser resolves them against the HTML's location.
        // Why did Push Expandable fail?
        // Maybe because `index.html` was treated as a blob download rather than served page?
        // Or maybe because `uploadAdAsset` paths are not guaranteed to be "sibling" in a way that relative links work if tokens are involved?
        // Firebase Storage URLs have tokens: `.../o/path%2Fto%2Ffile?alt=media&token=...`
        // A relative link `<img src="logo.png">` in a file loaded from `.../index.html?alt=media&token=...` 
        // will resolve to `.../logo.png`. That is NOT a valid Firebase Storage download URL.
        // It's missing the `?alt=media` query param at least.
        // So relative links DO NOT work in Firebase Storage hosted HTML files directly viewed.
        // WE MUST USE ABSOLUTE SIGNED URLS for the "Cloud HTML".

        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
      ]
      if (logoSource) files.push({ name: logoFileName, data: logoSource.file })

      if (backgroundSource) {
        files.push({ name: backgroundFileName, data: backgroundSource.file })
      }

      const zipBlob = await createZipBlob(zipName, files)

      // 4. Upload to Firebase
      setStatus("Uploading assets to cloud...")

      let uploadedBackgroundUrl = backgroundImageRef
      if (backgroundSource) {
        uploadedBackgroundUrl = await uploadAdAsset(backgroundSource.file, { userId, campaign, fileName: backgroundFileName })
      }

      let uploadedLogoUrl = logoUrl
      if (logoSource) {
        uploadedLogoUrl = await uploadAdAsset(logoSource.file, { userId, campaign, fileName: logoFileName })
      }

      const zipUrl = await uploadAdAsset(zipBlob, { userId, campaign, fileName: zipName })

      // 0. Generate ID early for Tracking
      const newAdRef = doc(collection(db, "ads"));
      const docId = newAdRef.id;
      const trackingOrigin = window.location.origin;
      const trackingCode = TRACKING_SCRIPT
        .replace("[[AD_ID]]", docId)
        .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

      // Generate Cloud HTML with Absolute URLs for "Ver HTML" feature
      const htmlForCloud = buildPuzzleHtml({
        width: customWidth,
        height: customHeight,
        brandLabel,
        brandName,
        headline,
        ctaText,
        ctaUrl,
        winTitle,
        winText,
        winCtaText,
        winCtaUrl,
        backgroundImage: uploadedBackgroundUrl, // Absolute URL
        logoImage: uploadedLogoUrl,             // Absolute URL
        accentColor,
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
        type: "puzzle-300",
        zipUrl,
        assets: {
          background: uploadedBackgroundUrl,
          logo: uploadedLogoUrl
        },
        htmlUrl,
        settings: manifest.settings
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
            <Label>Campaña(nombre)</Label>
            <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Ej: ACME_Q1_2026" />
          </div>

          <div className="space-y-2">
            <Label>Nombre del anuncio</Label>
            <Input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Ej: HP_300x250_puzzle" />
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
              <div className="font-mono">{backgroundSource ? backgroundFileName : "background (URL)"}</div>
              <div className="font-mono">manifest.json</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Marca (label)</Label>
              <Input value={brandLabel} onChange={(e) => setBrandLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Marca (titulo)</Label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headline</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>CTA texto</Label>
              <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://www.cronista.com" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Win titulo</Label>
              <Input value={winTitle} onChange={(e) => setWinTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Win texto</Label>
              <Input value={winText} onChange={(e) => setWinText(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Win CTA texto</Label>
              <Input value={winCtaText} onChange={(e) => setWinCtaText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Win CTA URL</Label>
              <Input value={winCtaUrl} onChange={(e) => setWinCtaUrl(e.target.value)} placeholder="https://www.cronista.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color principal (RGBA)</Label>
            <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="rgba(99, 161, 5, 1)" />
          </div>


          <div className="space-y-2">
            <Label>Background (subi imagen)</Label>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={onBackgroundChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => backgroundInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {backgroundSource ? `Cargado: ${backgroundSource.file.name}` : "Subir background"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Background (URL)</Label>
            <Input
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
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
          <Card className="border-border bg-card p-6 border-emerald-500/50 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-emerald-500">Ad Ready!</h3>
              <Button variant="ghost" size="sm" onClick={handleCopyScript}>
                <Copy className="h-4 w-4 mr-2" /> Copy Script
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

        <Card className="border-border bg-card p-8 space-y-3">
          <Label>Preview (HTML)</Label>
          <div className="overflow-hidden rounded-md border">
            <iframe
              title="Puzzle preview"
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
