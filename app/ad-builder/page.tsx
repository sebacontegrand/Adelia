"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import JSZip from "jszip"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Image as ImageIcon } from "lucide-react"

type ExpandAction = "click" | "mouseover"

type SourceInfo = {
  file: File
  w: number
  h: number
  mime: string
  bytes: number
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function safeFileComponent(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80)
}

async function getImageBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file)
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, targetW: number, targetH: number) {
  const imgRatio = img.width / img.height
  const targetRatio = targetW / targetH

  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height

  if (imgRatio > targetRatio) {
    // wider → crop sides
    sw = img.height * targetRatio
    sx = (img.width - sw) / 2
  } else {
    // taller → crop top/bottom
    sh = img.width / targetRatio
    sy = (img.height - sh) / 2
  }

  ctx.clearRect(0, 0, targetW, targetH)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH)
}

async function autoCropCoverToPngBlob(file: File, targetW: number, targetH: number): Promise<Blob> {
  const bmp = await getImageBitmap(file)
  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not available in this browser.")
  drawCover(ctx, bmp, targetW, targetH)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to export PNG."))), "image/png")
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function generateadeliaHtmlFileBased(params: {
  width: number
  collapsedHeight: number
  expandedHeight: number
  clickTag: string
  initExpanded: boolean
  autoCloseSeconds: number
  collapseSeconds: number
  expandAction: ExpandAction
  transitionMs: number
  createClickLayer: boolean
  collapsedFileNameInZip: string
  expandedFileNameInZip: string
}) {
  const safeClickTag = escapeHtmlAttr(params.clickTag)

  return `<!DOCTYPE HTML>
<html lang="en-us">
<head>
  <meta name="ad.size" content="width=${params.width},height=${params.expandedHeight}">
  <script>
    var adelia = { msgEvents: [], savedEvents:[] };

    var clickTag = "${safeClickTag}";
    var initExpanded = "${params.initExpanded ? "true" : "false"}";
    var autoClose = "${Number(params.autoCloseSeconds)}"*1;
    var collapseSeconds = "${Number(params.collapseSeconds)}";
    var expandAction = "${params.expandAction}";

    var iconsStyle   = "width:62px;position:absolute;left:0px;top:0;border:0;"
                     + "font-family:Arial;font-size:11px;padding:3px;background-color:transparent;"
                     + "text-align:center;";

    var openIconHTML = "[&nbsp;OPEN&nbsp;]";
    var closeIconHTML= "[&nbsp;CLOSE&nbsp;]";

    var setIconsTimeout = window.setTimeout(function() {
        document.getElementById("dfpIconsContainer").innerHTML = "<div style='"+iconsStyle
            + ";cursor:pointer;z-index:100' onclick='adelia.toggleAd()'><div id='dfpIconClose'>"
            + closeIconHTML+"</div><div id='dfpIconOpen' style='display:none'>"+openIconHTML+"</div></div>";
    },2000);

    adelia.expanded = (initExpanded=="true");
    adelia.timeout = null;
    adelia.autoCloseTimeout = null;

    adelia.processMessage = function(e) {
        if(e.data && e.data.iconsStyle && e.data.openIconHTML && e.data.closeIconHTML) {
          window.clearTimeout(setIconsTimeout);
          document.getElementById("dfpIconsContainer").innerHTML = "<div style='"+e.data.iconsStyle+";cursor:pointer;z-index:100' onclick='adelia.toggleAd({track:true})'><div id='dfpIconClose'>"
            +e.data.closeIconHTML+"</div><div id='dfpIconOpen'>"+e.data.openIconHTML+"</div></div>";
          adelia.syncSize();
        }
    }

    window.addEventListener ? window.addEventListener("message", adelia.processMessage, !1)
      : (window.attachEvent && window.attachEvent("message", adelia.processMessage));

    adelia.toggleAd = function(params) {
        adelia.expanded = !adelia.expanded;
        adelia.syncSize(params);
    }

    adelia.syncSize = function(params) {
      params = params || {};
      window.clearTimeout(adelia.timeout);
      if(adelia.expanded) {
        document.getElementById("dfpIconOpen") && (document.getElementById("dfpIconOpen").style.display="none");
        document.getElementById("dfpIconClose") && (document.getElementById("dfpIconClose").style.display="");

        document.getElementById("ad_collapsed") && (document.getElementById("ad_collapsed").style.display = "none");
        document.getElementById("ad_expanded") && (document.getElementById("ad_expanded").style.display = "block");
      } else {
        document.getElementById("dfpIconOpen") && (document.getElementById("dfpIconOpen").style.display="");
        document.getElementById("dfpIconClose") && (document.getElementById("dfpIconClose").style.display="none");

        window.clearTimeout(adelia.autoCloseTimeout);

        adelia.timeout = window.setTimeout(function() {
          document.getElementById("ad_collapsed") && (document.getElementById("ad_collapsed").style.display = "block");
          document.getElementById("ad_expanded") && (document.getElementById("ad_expanded").style.display = "none")
        }, ${Number(params.transitionMs)});
      }

      if(!adelia.last_msg || adelia.last_msg != adelia.expanded) {
        var action = (adelia.expanded?"expand":"collapse");
        if(params.autoclose && action=="collapse") { action = "collapse_auto"; }
        var msg = { m: "adelia", a:action, f:"101", n:"18_1300" }
        if(!params.track) { msg.nt=true; }
        window.top.postMessage(msg , "*");
      }
      adelia.last_msg = adelia.expanded;
    }

    if(autoClose > 0) {
      adelia.autoCloseTimeout = setTimeout(function() {
        adelia.expanded = false;
        adelia.syncSize({autoclose:true})}, 1000 * autoClose);
    }
  </script>
</head>

<body style='margin:0;overflow:hidden'>

  <script>
    var params = {"type":"image","collapsedHeight":"${params.collapsedHeight}","expandedHeight":"${params.expandedHeight}","transition":"${Number(params.transitionMs)}","impression_pixel":"","activeview_pixel":"","click_pixel":""};
    window.top.postMessage({ m:"adelia", a:"print", f:"101", n:"18_1300", p: params } , "*");
  </script>

  <script>
    function adelia_click() {
      window.top.postMessage({ m:'adelia', a:'click', f:'101', n:'18_1300' }, '*');
      window.open(clickTag, '_blank');
    }
  </script>

  ${params.createClickLayer ? `
  <div id='adelia_click_div' style='position: fixed; width: 100%; height: 100%; top: 0; overflow: hidden; z-index: 98; display: block; cursor:pointer' onclick='adelia_click()'></div>
  ` : ""}

  <div id='dfpIconsContainer'></div>

  <div id='ad_collapsed' style='display:none;width:${params.width}px;height:${params.collapsedHeight}px;overflow:hidden;'>
    <img src='${params.collapsedFileNameInZip}' style='border:0;width:${params.width}px;height:${params.collapsedHeight}px' />
  </div>

  <div id='ad_expanded' style='display:none;width:${params.width}px;height:${params.expandedHeight}px;overflow:hidden;'>
    <img src='${params.expandedFileNameInZip}' style='border:0;width:${params.width}px;height:${params.expandedHeight}px' />
  </div>

  <script>
    var mouseoverTimeout=null;
    if(expandAction=="mouseover") {
      document.getElementById("dfpIconsContainer").style.display="none";
      document.body.onmouseover=function() { window.clearTimeout(mouseoverTimeout); adelia.mouseoverExpand(); };
      document.body.onmouseout=function() { window.clearTimeout(mouseoverTimeout); mouseoverTimeout=window.setTimeout(adelia.mouseoverCollapse,collapseSeconds*1000); };
    }
    adelia.mouseoverExpand = function() { adelia.expanded=true; adelia.syncSize({track:true}); }
    adelia.mouseoverCollapse = function() { adelia.expanded=false; adelia.syncSize({track:true}); }
    adelia.syncSize();
  </script>

</body>
</html>`
}

async function downloadZip(zipName: string, files: Array<{ name: string; data: string | Blob }>) {
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

export default function adeliaBuilderTwoFilesPreviewZip() {
  const { toast } = useToast()

  // Naming
  const [campaign, setCampaign] = useState("")
  const [placement, setPlacement] = useState("")

  // Params
  const [autoCloseSeconds, setAutoCloseSeconds] = useState("8")
  const [createClickLayer, setCreateClickLayer] = useState(true)
  const [clickTagUrl, setClickTagUrl] = useState("https://cronista.com")
  const [transitionMs, setTransitionMs] = useState("250")
  const [expandAction, setExpandAction] = useState<ExpandAction>("click")

  // Sources (two uploads)
  const [collapsedSource, setCollapsedSource] = useState<SourceInfo | null>(null)
  const [expandedSource, setExpandedSource] = useState<SourceInfo | null>(null)

  // Preview outputs (cropped)
  const [collapsedPreviewUrl, setCollapsedPreviewUrl] = useState<string>("")
  const [expandedPreviewUrl, setExpandedPreviewUrl] = useState<string>("")

  // Output HTML (inspect)
  const [generatedHtml, setGeneratedHtml] = useState("")

  // Feedback
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)

  const collapsedInputRef = useRef<HTMLInputElement | null>(null)
  const expandedInputRef = useRef<HTMLInputElement | null>(null)

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (collapsedPreviewUrl) URL.revokeObjectURL(collapsedPreviewUrl)
      if (expandedPreviewUrl) URL.revokeObjectURL(expandedPreviewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const namingPrefix = useMemo(() => {
    const c = safeFileComponent(campaign)
    const p = safeFileComponent(placement)
    const prefix = [c, p].filter(Boolean).join("__")
    return prefix || "adelia"
  }, [campaign, placement])

  const collapsedNameInZip = `${namingPrefix}__collapsed.png`
  const expandedNameInZip = `${namingPrefix}__expanded.png`
  const zipName = `${namingPrefix}.zip`

  async function handlePickFile(kind: "collapsed" | "expanded", file: File) {
    setError("")
    setStatus("Reading image…")

    if (!file.type.startsWith("image/")) {
      setError("The selected file is not an image.")
      setStatus("")
      return
    }

    const bmp = await getImageBitmap(file)
    const info: SourceInfo = {
      file,
      w: bmp.width,
      h: bmp.height,
      mime: file.type,
      bytes: file.size,
    }

    // Generate preview blob (cropped output)
    setStatus(`Auto-cropping ${kind}…`)
    const target = kind === "collapsed" ? { w: 970, h: 90 } : { w: 970, h: 250 }
    const outBlob = await autoCropCoverToPngBlob(file, target.w, target.h)
    const outUrl = URL.createObjectURL(outBlob)

    // Swap preview URL safely
    if (kind === "collapsed") {
      if (collapsedPreviewUrl) URL.revokeObjectURL(collapsedPreviewUrl)
      setCollapsedPreviewUrl(outUrl)
      setCollapsedSource(info)
    } else {
      if (expandedPreviewUrl) URL.revokeObjectURL(expandedPreviewUrl)
      setExpandedPreviewUrl(outUrl)
      setExpandedSource(info)
    }

    setStatus(`${kind.toUpperCase()} ready: ${target.w}×${target.h}`)
    toast({ title: `${kind.toUpperCase()} loaded`, description: `Source ${info.w}×${info.h} → output ${target.w}×${target.h}` })
  }

  const onCollapsedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    try {
      setIsWorking(true)
      await handlePickFile("collapsed", f)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Failed processing collapsed image.")
      setStatus("")
    } finally {
      setIsWorking(false)
    }
  }

  const onExpandedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    try {
      setIsWorking(true)
      await handlePickFile("expanded", f)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Failed processing expanded image.")
      setStatus("")
    } finally {
      setIsWorking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStatus("")

    if (!campaign.trim() || !placement.trim()) {
      setError("Please fill Campaign and Placement (used for naming).")
      return
    }
    if (!clickTagUrl.trim()) {
      setError("Please fill ClickTag URL.")
      return
    }
    if (!collapsedSource || !expandedSource) {
      setError("Please upload BOTH collapsed and expanded source images.")
      return
    }

    try {
      setIsWorking(true)
      setStatus("Generating final cropped assets…")

      // Build final blobs (not reusing preview URLs; we want fresh blobs for the zip)
      const collapsedBlob = await autoCropCoverToPngBlob(collapsedSource.file, 970, 90)
      const expandedBlob = await autoCropCoverToPngBlob(expandedSource.file, 970, 250)

      setStatus("Generating HTML + manifest…")

      const html = generateadeliaHtmlFileBased({
        width: 970,
        collapsedHeight: 90,
        expandedHeight: 250,
        clickTag: clickTagUrl,
        initExpanded: true,
        autoCloseSeconds: Number(autoCloseSeconds || 0),
        collapseSeconds: 1,
        expandAction,
        transitionMs: Number(transitionMs || 250),
        createClickLayer,
        collapsedFileNameInZip: collapsedNameInZip,
        expandedFileNameInZip: expandedNameInZip,
      })
      setGeneratedHtml(html)

      const manifest = {
        version: "1.0",
        generated_at: new Date().toISOString(),
        campaign: campaign.trim(),
        placement: placement.trim(),
        naming: {
          prefix: namingPrefix,
          zip: zipName,
          collapsed: collapsedNameInZip,
          expanded: expandedNameInZip,
        },
        behavior: {
          initExpanded: true,
          autoCloseSeconds: Number(autoCloseSeconds || 0),
          collapseSeconds: 1,
          expandAction,
          transitionMs: Number(transitionMs || 250),
          createClickLayer,
          clickTag: clickTagUrl.trim(),
        },
        sources: [
          {
            role: "collapsed",
            original_name: collapsedSource.file.name,
            original_dimensions: { width: collapsedSource.w, height: collapsedSource.h },
            original_mime: collapsedSource.mime,
            original_bytes: collapsedSource.bytes,
            output_file: collapsedNameInZip,
            output_dimensions: { width: 970, height: 90 },
            output_mime: "image/png",
            crop_mode: "cover",
          },
          {
            role: "expanded",
            original_name: expandedSource.file.name,
            original_dimensions: { width: expandedSource.w, height: expandedSource.h },
            original_mime: expandedSource.mime,
            original_bytes: expandedSource.bytes,
            output_file: expandedNameInZip,
            output_dimensions: { width: 970, height: 250 },
            output_mime: "image/png",
            crop_mode: "cover",
          },
        ],
        files: ["index.html", collapsedNameInZip, expandedNameInZip, "manifest.json"],
      }

      setStatus("Building ZIP…")

      await downloadZip(zipName, [
        { name: "index.html", data: html },
        { name: collapsedNameInZip, data: collapsedBlob },
        { name: expandedNameInZip, data: expandedBlob },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
      ])

      setStatus(`ZIP downloaded: ${zipName}`)
      toast({ title: "ZIP generated", description: zipName })
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Error generating ZIP.")
      setStatus("")
      toast({ title: "Error", description: err?.message ?? "Error generating ZIP.", variant: "destructive" })
    } finally {
      setIsWorking(false)
    }
  }

  return (
   <div className="min-h-screen">
  <Navbar />

  <main className="container mx-auto px-4 py-12">
    <div className="mb-10 text-center">
      <h1 className="mb-3 text-4xl font-bold">Adelia Builder</h1>
      <p className="mx-auto max-w-3xl text-muted-foreground">
        Subí las creatividades <strong>collapsed</strong> y <strong>expanded</strong> (de cualquier tamaño). El builder genera automáticamente
        los PNG exactos de <strong>970×90</strong> y <strong>970×250</strong>, muestra una previsualización del recorte y exporta un ZIP con
        <strong> index.html</strong> + <strong>manifest</strong>.
      </p>
    </div>

    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
      {/* FORM */}
      <Card className="border-border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Naming */}
          <div className="space-y-2">
            <Label>Campaña (nombre)</Label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Ej: ACME_Q1_2026"
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo ZIP (nombre / placement)</Label>
            <Input
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              placeholder="Ej: HP_970x250_expandable"
            />
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ZIP</span>
              <span className="font-mono">{zipName}</span>
            </div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="font-mono">index.html</div>
              <div className="font-mono">{collapsedNameInZip}</div>
              <div className="font-mono">{expandedNameInZip}</div>
              <div className="font-mono">manifest.json</div>
            </div>
          </div>

          {/* Params */}
          <div className="space-y-2">
            <Label>Auto-cierre (segundos)</Label>
            <Input
              value={autoCloseSeconds}
              onChange={(e) => setAutoCloseSeconds(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Capa de click (ClickTag)</Label>
              <p className="text-sm text-muted-foreground">
                Activa una capa clickeable sobre el anuncio.
              </p>
            </div>
            <Switch checked={createClickLayer} onCheckedChange={setCreateClickLayer} />
          </div>

          <div className="space-y-2">
            <Label>URL de ClickTag</Label>
            <Input
              value={clickTagUrl}
              onChange={(e) => setClickTagUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Duración de transición (ms)</Label>
            <Input
              value={transitionMs}
              onChange={(e) => setTransitionMs(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Acción de expansión</Label>
            <Select value={expandAction} onValueChange={(v) => setExpandAction(v as ExpandAction)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">click</SelectItem>
                <SelectItem value="mouseover">mouseover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Uploads */}
          <div className="space-y-2">
            <Label>Fuente Collapsed (cualquier tamaño) → salida 970×90</Label>
            <input
              ref={collapsedInputRef}
              type="file"
              accept="image/*"
              onChange={onCollapsedChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => collapsedInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {collapsedSource ? `Cargado: ${collapsedSource.file.name}` : "Subir fuente collapsed"}
            </Button>
            {collapsedSource && (
              <p className="text-xs text-muted-foreground">
                Fuente: {collapsedSource.w}×{collapsedSource.h} · {(collapsedSource.bytes / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fuente Expanded (cualquier tamaño) → salida 970×250</Label>
            <input
              ref={expandedInputRef}
              type="file"
              accept="image/*"
              onChange={onExpandedChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => expandedInputRef.current?.click()}
              disabled={isWorking}
            >
              <Upload className="h-4 w-4" />
              {expandedSource ? `Cargado: ${expandedSource.file.name}` : "Subir fuente expanded"}
            </Button>
            {expandedSource && (
              <p className="text-xs text-muted-foreground">
                Fuente: {expandedSource.w}×{expandedSource.h} · {(expandedSource.bytes / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          )}
          {status && <div className="rounded-md border bg-muted p-3 text-sm">{status}</div>}

          <Button type="submit" className="w-full" size="lg" disabled={isWorking}>
            <Download className="mr-2 h-4 w-4" />
            {isWorking ? "Procesando…" : "Generar y descargar ZIP"}
          </Button>
        </form>
      </Card>

      {/* PREVIEW */}
      <Card className="border-border bg-card p-8 space-y-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Previsualización del recorte</h2>
        </div>

        {/* Collapsed preview */}
        <div className="space-y-2">
          <Label>Salida Collapsed (970×90)</Label>
          <div className="rounded-lg border bg-secondary/20 p-3">
            {collapsedPreviewUrl ? (
              <img
                src={collapsedPreviewUrl}
                alt="Previsualización collapsed"
                className="block w-full rounded-md"
                style={{ maxWidth: 970 }}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Subí una fuente collapsed para ver la previsualización del recorte.
              </div>
            )}
          </div>
        </div>

        {/* Expanded preview */}
        <div className="space-y-2">
          <Label>Salida Expanded (970×250)</Label>
          <div className="rounded-lg border bg-secondary/20 p-3">
            {expandedPreviewUrl ? (
              <img
                src={expandedPreviewUrl}
                alt="Previsualización expanded"
                className="block w-full rounded-md"
                style={{ maxWidth: 970 }}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Subí una fuente expanded para ver la previsualización del recorte.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>HTML generado (inspección)</Label>
          <textarea
            className="min-h-[180px] w-full rounded-md border bg-background p-3 font-mono text-xs"
            value={generatedHtml}
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            El HTML referencia los nombres de los PNG dentro del ZIP. Para probarlo, descomprimí y serví la carpeta con un servidor local.
          </p>
        </div>
      </Card>
    </div>
  </main>
</div>

  )
}
