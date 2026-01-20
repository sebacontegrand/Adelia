"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import JSZip from "jszip"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload } from "lucide-react"

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

async function downloadZip(zipName: string, files: { name: string; data: string | Blob }[]) {
  const zip = new JSZip()
  for (const f of files) zip.file(f.name, f.data)

  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = zipName
  a.click()
  URL.revokeObjectURL(url)
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
    width: 300px;
    height: 250px;
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
    width: 280px;
    height: 140px;
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
</style>
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
      <a class="cta"
         href="%%CLICK_URL_ESC%%${safeCtaUrl}"
         target="_blank">
        Ver más ›
      </a>
    </div>
  </div>

  <div class="win-overlay" id="winOverlay">
    <div class="win-box">
      <div class="win-title">¡Juego completado! 🎉</div>
      <div class="win-text">
        Clickeaste la imagen a color a tiempo.
        Conocé más sobre la serie 6E.
      </div>
      <a class="win-cta"
         href="%%CLICK_URL_ESC%%${safeCtaUrl}"
         target="_blank">
        Ir al sitio
      </a>
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

export function ColorAdBuilder() {
  const { toast } = useToast()

  const [campaign, setCampaign] = useState("")
  const [placement, setPlacement] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("#63A105")
  const [ctaUrl, setCtaUrl] = useState("https://www.cronista.com")
  const [brandLabel, setBrandLabel] = useState("JHON DEERE")
  const [brandName, setBrandName] = useState("Serie 6E")

  const [logoSource, setLogoSource] = useState<SourceInfo | null>(null)
  const [bwSource, setBwSource] = useState<SourceInfo | null>(null)
  const [colorSource, setColorSource] = useState<SourceInfo | null>(null)

  const [previewLogoUrl, setPreviewLogoUrl] = useState("")
  const [previewBwUrl, setPreviewBwUrl] = useState("")
  const [previewColorUrl, setPreviewColorUrl] = useState("")

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStatus("")

    if (!logoSource || !bwSource || !colorSource) {
      setError("Subi logo, imagen ByN y imagen color para continuar.")
      return
    }

    try {
      setIsWorking(true)

      const html = buildColorAdHtml({
        backgroundColor,
        logoImage: logoFileName,
        bwImage: bwFileName,
        colorImage: colorFileName,
        ctaUrl: ctaUrl.trim(),
        brandLabel,
        brandName,
      })

      setGeneratedHtml(html)

      const preview = buildColorAdHtml({
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
        },
        assets: {
          logo_upload: true,
          bw_upload: true,
          color_upload: true,
        },
      }

      await downloadZip(zipName, [
        { name: "index.html", data: html },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
        { name: logoFileName, data: logoSource.file },
        { name: bwFileName, data: bwSource.file },
        { name: colorFileName, data: colorSource.file },
      ])

      setStatus(`ZIP downloaded: ${zipName}`)
      toast({ title: "ZIP generado", description: zipName })
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
            <Label>Archivo ZIP (nombre / placement)</Label>
            <Input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Ej: JD_300x250_colorad" />
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
            <Download className="mr-2 h-4 w-4" />
            {isWorking ? "Procesando..." : "Generar y descargar ZIP"}
          </Button>
        </form>
      </Card>

      <Card className="border-border bg-card p-8 space-y-3">
        <Label>Preview (HTML)</Label>
        <div className="overflow-hidden rounded-md border">
          <iframe
            title="ColorAd preview"
            className="h-[260px] w-full bg-white"
            sandbox="allow-scripts allow-popups"
            srcDoc={previewHtml || "<html><body style='margin:0;font-family:system-ui'>Genera un ZIP para ver el preview.</body></html>"}
          />
        </div>
        <textarea
          className="min-h-[180px] w-full rounded-md border bg-background p-3 font-mono text-xs"
          value={generatedHtml}
          readOnly
        />
      </Card>
    </div>
  )
}
