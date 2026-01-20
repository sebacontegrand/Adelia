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

function buildPodcastWithHtml(params: {
  backgroundImageUrl: string
  logoImage: string
  brandText: string
  titleText: string
  ctaUrl: string
  audioSource: string
}) {
  const safeBackgroundImage = escapeHtmlAttr(params.backgroundImageUrl)
  const safeLogoImage = escapeHtmlAttr(params.logoImage)
  const safeBrandText = escapeHtmlAttr(params.brandText)
  const safeTitleText = escapeHtmlAttr(params.titleText)
  const safeCtaUrl = escapeHtmlAttr(params.ctaUrl)
  const safeAudioSource = escapeHtmlAttr(params.audioSource)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>300x250 Podcast Snippet</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body { font-family: Arial, sans-serif; }

  .banner {
    position: relative;
    width: 300px;
    height: 250px;
    overflow: hidden;
    background: #000;
    color: #fff;
  }

  .image-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-image: url("${safeBackgroundImage}");
    filter: brightness(0.85);
    z-index: 1;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0,0,0,0.85) 0%,
      rgba(0,0,0,0.4) 40%,
      rgba(0,0,0,0.0) 100%
    );
    z-index: 2;
  }

  .content {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 12px;
    z-index: 3;
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    object-fit: contain;
    background: #fff;
    padding: 2px;
  }

  .brand-texts {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .brand {
    font-size: 10px;
    opacity: 0.9;
    text-transform: uppercase;
  }

  .title {
    font-size: 14px;
    font-weight: bold;
  }

  .player {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px);
  }

  .play-pause-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #63A105;
    color: #fff;
    cursor: pointer;
    font-size: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .progress-container {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: rgba(255,255,255,0.25);
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    position: absolute;
    inset: 0;
    width: 0%;
    background: #63A105;
  }

  .time {
    font-size: 11px;
    opacity: 0.85;
    flex-shrink: 0;
    min-width: 40px;
    text-align: right;
  }

  .cta {
    display: inline-block;
    padding: 4px 10px;
    background: #63A105;
    border-radius: 999px;
    font-size: 11px;
    font-weight: bold;
    color: #fff;
    text-decoration: none;
  }
</style>
</head>

<body>
<div class="banner">

  <div class="image-bg"></div>
  <div class="overlay"></div>

  <div class="content">
    <div class="header-row">
      <img class="brand-logo"
           src="${safeLogoImage}"
           alt="Logo del Cliente" />

      <div class="brand-texts">
        <div class="brand">${safeBrandText}</div>
        <div class="title">${safeTitleText}</div>
      </div>
    </div>

    <div class="player">
      <button class="play-pause-btn" id="playPauseBtn">▶</button>

      <div class="progress-container">
        <div class="progress-bar" id="progressBar"></div>
      </div>

      <div class="time" id="timeLabel">0:00</div>
    </div>

    <a class="cta"
       href="%%CLICK_URL_ESC%%${safeCtaUrl}"
       target="_blank">
      Ver más ›
    </a>
  </div>

  <audio id="audio" preload="none">
    <source src="${safeAudioSource}" type="audio/mpeg">
  </audio>

</div>

<script>
  (function () {
    var audio = document.getElementById('audio');
    var playBtn = document.getElementById('playPauseBtn');
    var progressBar = document.getElementById('progressBar');
    var timeLabel = document.getElementById('timeLabel');

    audio.muted = true;
    audio.play().then(function () {
      playBtn.textContent = '⏸';
    }).catch(function () {
      console.log("Autoplay bloqueado.");
    });

    function formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60);
      if (s < 10) s = '0' + s;
      return m + ':' + s;
    }

    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();

      if (audio.muted) audio.muted = false;

      if (audio.paused) {
        audio.play();
        playBtn.textContent = '⏸';
      } else {
        audio.pause();
        playBtn.textContent = '▶';
      }
    });

    audio.addEventListener('timeupdate', function () {
      if (!isNaN(audio.duration)) {
        var percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = percent + '%';
        timeLabel.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('ended', function () {
      playBtn.textContent = '▶';
      progressBar.style.width = '0%';
      timeLabel.textContent = '0:00';
    });
  })();
</script>

</body>
</html>`
}

export function PodcastwithBuilder() {
  const { toast } = useToast()

  const [campaign, setCampaign] = useState("")
  const [placement, setPlacement] = useState("")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("")
  const [brandText, setBrandText] = useState("PRESENTADO POR Santander")
  const [titleText, setTitleText] = useState("Episodio: ¿Como administrar los negocios?")
  const [ctaUrl, setCtaUrl] = useState("https://www.tusitio.com")

  const [logoSource, setLogoSource] = useState<SourceInfo | null>(null)
  const [audioSource, setAudioSource] = useState<SourceInfo | null>(null)

  const [previewLogoUrl, setPreviewLogoUrl] = useState("")
  const [previewAudioUrl, setPreviewAudioUrl] = useState("")

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)

  const namingPrefix = useMemo(() => {
    const c = safeFileComponent(campaign)
    const p = safeFileComponent(placement)
    const prefix = [c, p].filter(Boolean).join("__")
    return prefix || "podcastwith"
  }, [campaign, placement])

  const zipName = `${namingPrefix}.zip`
  const logoFileName = logoSource ? `${namingPrefix}__logo${getFileExtension(logoSource.file.name, ".png")}` : ""
  const audioFileName = audioSource ? `${namingPrefix}__audio${getFileExtension(audioSource.file.name, ".mp3")}` : ""

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setLogoSource({ file: f, bytes: f.size })
    setPreviewLogoUrl(await fileToDataUrl(f))
    setStatus(`Logo: ${f.name}`)
  }

  const onAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setAudioSource({ file: f, bytes: f.size })
    setPreviewAudioUrl(await fileToDataUrl(f))
    setStatus(`Audio: ${f.name}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStatus("")

    if (!logoSource || !audioSource) {
      setError("Subi logo y audio para continuar.")
      return
    }

    if (!backgroundImageUrl.trim()) {
      setError("Agrega una URL de background.")
      return
    }

    try {
      setIsWorking(true)

      const html = buildPodcastWithHtml({
        backgroundImageUrl: backgroundImageUrl.trim(),
        logoImage: logoFileName,
        brandText,
        titleText,
        ctaUrl: ctaUrl.trim(),
        audioSource: audioFileName,
      })

      setGeneratedHtml(html)

      const preview = buildPodcastWithHtml({
        backgroundImageUrl: backgroundImageUrl.trim(),
        logoImage: previewLogoUrl || logoFileName,
        brandText,
        titleText,
        ctaUrl: ctaUrl.trim(),
        audioSource: previewAudioUrl || audioFileName,
      })
      setPreviewHtml(preview)

      const manifest = {
        format: "podcastwith",
        version: "1.0.0",
        generated_at: new Date().toISOString(),
        naming: {
          campaign,
          placement,
          zip_name: zipName,
          files: {
            logo: logoFileName,
            audio: audioFileName,
          },
        },
        settings: {
          background_image: backgroundImageUrl.trim(),
          cta_url: ctaUrl.trim(),
        },
        assets: {
          logo_upload: true,
          audio_upload: true,
        },
      }

      await downloadZip(zipName, [
        { name: "index.html", data: html },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
        { name: logoFileName, data: logoSource.file },
        { name: audioFileName, data: audioSource.file },
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
            <Input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Ej: POD_300x250" />
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ZIP</span>
              <span className="font-mono">{zipName}</span>
            </div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="font-mono">index.html</div>
              <div className="font-mono">{logoFileName || "logo.png"}</div>
              <div className="font-mono">{audioFileName || "audio.mp3"}</div>
              <div className="font-mono">manifest.json</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background (URL)</Label>
            <Input
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Brand text</Label>
            <Input value={brandText} onChange={(e) => setBrandText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input value={titleText} onChange={(e) => setTitleText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>URL del sitio</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://www.tusitio.com" />
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
            <Label>Audio (mp3)</Label>
            <input ref={audioInputRef} type="file" accept="audio/*" onChange={onAudioChange} className="hidden" />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => audioInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {audioSource ? `Cargado: ${audioSource.file.name}` : "Subir audio"}
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
            title="Podcastwith preview"
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
