"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, Copy, Save } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord } from "@/firebase/firestore"

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
    color: #000;
    text-decoration: none;
    font-family: inherit;
    cursor: pointer;
    border: none;
  }
</style>
<script>
  var urlParams = new URLSearchParams(window.location.search);
  var clickTag = urlParams.get("clickTag");

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

    <button class="cta" onclick="exitClick('${safeCtaUrl}')">
      Ver más ›
    </button>
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

import { type AdRecord } from "@/firebase/firestore"

export function PodcastwithBuilder({ initialData }: { initialData?: AdRecord }) {
  const { toast } = useToast()
  const { data: session } = useSession()

  const [campaign, setCampaign] = useState(initialData?.campaign ?? "")
  const [placement, setPlacement] = useState(initialData?.placement ?? "")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialData?.settings?.background_image ?? "")
  const [brandText, setBrandText] = useState(initialData?.settings?.brandText ?? "PRESENTADO POR Santander")
  const [titleText, setTitleText] = useState(initialData?.settings?.titleText ?? "Episodio: ¿Como administrar los negocios?")
  const [ctaUrl, setCtaUrl] = useState(initialData?.settings?.cta_url ?? "https://www.tusitio.com")

  const [logoSource, setLogoSource] = useState<SourceInfo | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialData?.assets?.logo ?? "")
  const [audioSource, setAudioSource] = useState<SourceInfo | null>(null)
  const [audioUrl, setAudioUrl] = useState(initialData?.assets?.audio ?? "")

  const [previewLogoUrl, setPreviewLogoUrl] = useState("")
  const [previewAudioUrl, setPreviewAudioUrl] = useState("")

  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [embedScript, setEmbedScript] = useState("")

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

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript)
    toast({ title: "Copied!", description: "Embed script copied to clipboard." })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStatus("")
    setEmbedScript("")

    if ((!logoSource && !logoUrl) || (!audioSource && !audioUrl)) {
      setError("Subi logo y audio para continuar.")
      return
    }

    if (!backgroundImageUrl.trim()) {
      setError("Agrega una URL de background.")
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
      const audioRef = audioSource ? audioFileName : audioUrl

      const html = buildPodcastWithHtml({
        backgroundImageUrl: backgroundImageUrl.trim(),
        logoImage: logoRef,
        brandText,
        titleText,
        ctaUrl: ctaUrl.trim(),
        audioSource: audioRef,
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

      const files: { name: string; data: string | Blob }[] = [
        { name: "index.html", data: html },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
      ]
      if (logoSource) files.push({ name: logoFileName, data: logoSource.file })
      if (audioSource) files.push({ name: audioFileName, data: audioSource.file })

      const zipBlob = await createZipBlob(zipName, files)

      // 4. Upload to Firebase
      setStatus("Uploading assets to cloud...")

      let uploadedLogoUrl = logoUrl
      if (logoSource) {
        uploadedLogoUrl = await uploadAdAsset(logoSource.file, { userId, campaign, fileName: logoFileName })
      }

      let uploadedAudioUrl = audioUrl
      if (audioSource) {
        uploadedAudioUrl = await uploadAdAsset(audioSource.file, { userId, campaign, fileName: audioFileName })
      }

      const zipUrl = await uploadAdAsset(zipBlob, { userId, campaign, fileName: zipName })

      // Generate Cloud HTML with Absolute URLs
      const htmlForCloud = buildPodcastWithHtml({
        backgroundImageUrl: backgroundImageUrl.trim(),
        logoImage: uploadedLogoUrl,     // Absolute
        brandText,
        titleText,
        ctaUrl: ctaUrl.trim(),
        audioSource: uploadedAudioUrl,  // Absolute
      })

      const htmlBlob = new Blob([htmlForCloud], { type: "text/html" })
      const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" })

      // 5. Save Record
      setStatus("Saving database record...")
      const docId = await saveAdRecord({
        userId,
        campaign,
        placement,
        type: "podcastwith",
        zipUrl,
        assets: {
          logo: uploadedLogoUrl,
          audio: uploadedAudioUrl
        },
        htmlUrl,
        settings: manifest.settings
      })

      // 6. Generate Embed Script
      const scriptCode = `<script>
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
              title="Podcastwith preview"
              className="h-[260px] w-full bg-white"
              sandbox="allow-scripts allow-popups"
              srcDoc={previewHtml || "<html><body style='margin:0;font-family:system-ui'>Genera un ZIP para ver el preview.</body></html>"}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
