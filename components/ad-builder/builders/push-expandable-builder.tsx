"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Image as ImageIcon, Save, Copy } from "lucide-react"

import { uploadAdAsset } from "@/firebase/storage"
import { saveAdRecord, getUserProfile, type UserProfile } from "@/firebase/firestore"
import { db } from "@/firebase/firebase.config"
import { doc, collection } from "firebase/firestore"
import { TRACKING_SCRIPT } from "@/components/ad-builder/tracking-script"

type ExpandAction = "click" | "mouseover"

type SourceInfo = {
  file: File
  w: number
  h: number
  mime: string
  bytes: number
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function safeFileComponent(value: string) {
  return value
    .trim()
    .replace(/\\s+/g, "_")
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
    // wider -> crop sides
    sw = img.height * targetRatio
    sx = (img.width - sw) / 2
  } else {
    // taller -> crop top/bottom
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
<html lang=\"en-us\">
<head>
  <meta name=\"ad.size\" content=\"width=${params.width},height=${params.expandedHeight}\">
  <script>
    var adelia = { msgEvents: [], savedEvents:[] };

    // We keep these for internal logic (expand/collapse)
    var initExpanded = \"${params.initExpanded ? "true" : "false"}\";
    var autoClose = \"${Number(params.autoCloseSeconds)}\"*1;
    var collapseSeconds = \"${Number(params.collapseSeconds)}\";
    var expandAction = \"${params.expandAction}\";

    var iconsStyle   = \"width:62px;position:absolute;left:0px;top:0;border:0;\"
                     + \"font-family:Arial;font-size:11px;padding:3px;background-color:transparent;\"
                     + \"text-align:center;\";


var openIconHTML  = \"&#9660;\"; // down arrow (expand)
var closeIconHTML = \"&#9650;\"; // up arrow (collapse)

    var setIconsTimeout = window.setTimeout(function() {
      document.getElementById(\"dfpIconsContainer\").innerHTML =
  \"<div style='\" + iconsStyle + \";z-index:100' onclick='adelia.toggleAd({track:true})'>\" +
    \"<div id='dfpIconClose'>\" + closeIconHTML + \"</div>\" +
    \"<div id='dfpIconOpen' style='display:none'>\" + openIconHTML + \"</div>\" +
  \"</div>\";

    },2000);

    adelia.expanded = (initExpanded==\"true\");
    adelia.timeout = null;
    adelia.autoCloseTimeout = null;

    adelia.processMessage = function(e) {
        if(e.data && e.data.iconsStyle && e.data.openIconHTML && e.data.closeIconHTML) {
          window.clearTimeout(setIconsTimeout);
          document.getElementById(\"dfpIconsContainer\").innerHTML = \"<div style='\"+e.data.iconsStyle+\";cursor:pointer;z-index:100' onclick='adelia.toggleAd({track:true})'><div id='dfpIconClose'>\"
            +e.data.closeIconHTML+\"</div><div id='dfpIconOpen'>\"+e.data.openIconHTML+\"</div></div>\";
          adelia.syncSize();
        }
    }

    window.addEventListener ? window.addEventListener(\"message\", adelia.processMessage, !1)
      : (window.attachEvent && window.attachEvent(\"message\", adelia.processMessage));

    adelia.toggleAd = function(params) {
        adelia.expanded = !adelia.expanded;
        adelia.syncSize(params);
    }

    adelia.syncSize = function(params) {
      params = params || {};
      window.clearTimeout(adelia.timeout);
      if(adelia.expanded) {
        document.getElementById(\"dfpIconOpen\") && (document.getElementById(\"dfpIconOpen\").style.display=\"none\");
        document.getElementById(\"dfpIconClose\") && (document.getElementById(\"dfpIconClose\").style.display=\"\");

        document.getElementById(\"ad_collapsed\") && (document.getElementById(\"ad_collapsed\").style.display = \"none\");
        document.getElementById(\"ad_expanded\") && (document.getElementById(\"ad_expanded\").style.display = \"block\");
      } else {
        document.getElementById(\"dfpIconOpen\") && (document.getElementById(\"dfpIconOpen\").style.display=\"\");
        document.getElementById(\"dfpIconClose\") && (document.getElementById(\"dfpIconClose\").style.display=\"none\");

        window.clearTimeout(adelia.autoCloseTimeout);

        adelia.timeout = window.setTimeout(function() {
          document.getElementById(\"ad_collapsed\") && (document.getElementById(\"ad_collapsed\").style.display = \"block\");
          document.getElementById(\"ad_expanded\") && (document.getElementById(\"ad_expanded\").style.display = \"none\")
        }, ${Number(params.transitionMs)});
      }

      if(!adelia.last_msg || adelia.last_msg != adelia.expanded) {
        var action = (adelia.expanded?\"expand\":\"collapse\");
        if(params.autoclose && action==\"collapse\") { action = \"collapse_auto\"; }
        var msg = { m: \"adelia\", a:action, f:\"101\", n:\"18_1300\" }
        if(!params.track) { msg.nt=true; }
        window.top.postMessage(msg , \"*\");
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
    var params = {\"type\":\"image\",\"collapsedHeight\":\"${params.collapsedHeight}\",\"expandedHeight\":\"${params.expandedHeight}\",\"transition\":\"${Number(params.transitionMs)}\",\"impression_pixel\":\"\",\"activeview_pixel\":\"\",\"click_pixel\":\"\"};
    window.top.postMessage({ m:\"adelia\", a:\"print\", f:\"101\", n:\"18_1300\", p: params } , \"*\");
  </script>
  
  <script>
    var urlParams = new URLSearchParams(window.location.search);
    var clickTag = urlParams.get("clickTag") || "";

    function exitClick(e) {
      if (window.reportEvent) window.reportEvent('click');
      // Avoid redirecting when clicking controls (like expand/close buttons)
      if (e.target.closest('#dfpIconsContainer')) return;
    
      var landing = "${safeClickTag}";

      if (clickTag) {
        window.open(clickTag + encodeURIComponent(landing), "_blank");
      } else {
        window.open(landing, "_blank");
      }
    }

    document.addEventListener("click", exitClick);
  </script>

  <div id='ad_container' style='position:relative; width:${params.width}px; height:${params.expandedHeight}px; overflow:hidden;'>
    <div id='dfpIconsContainer' style='position:absolute;left:0;top:0;width:62px;height:20px;z-index:100'></div>

    <!-- Transparent click layer for cursor, but logic handled by document listener above -->
    <a href='javascript:void(0);' id='ad_click'
      style='cursor:pointer;position:absolute;left:0;top:0;width:${params.width}px;height:${params.expandedHeight}px;display:${params.createClickLayer ? "block" : "none"};z-index:90'></a>

    <div id='ad_collapsed' style='display:${params.initExpanded ? "none" : "block"};'>
      <img src='${params.collapsedFileNameInZip}' width='${params.width}' height='${params.collapsedHeight}' style='border:0;display:block;'>
    </div>

    <div id='ad_expanded' style='display:${params.initExpanded ? "block" : "none"};'>
      <img src='${params.expandedFileNameInZip}' width='${params.width}' height='${params.expandedHeight}' style='border:0;display:block;'>
    </div>
  </div>

</body>
</html>`
}

async function createZipBlob(zipName: string, files: { name: string; data: string | Blob }[]) {
  const zip = new JSZip()
  for (const f of files) zip.file(f.name, f.data)
  return await zip.generateAsync({ type: "blob" })
}

import { type AdRecord } from "@/firebase/firestore"

async function fetchAssetBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch asset from URL")
  return await response.blob()
}

export function PushExpandableBuilder({ initialData }: { initialData?: AdRecord }) {
  const { toast } = useToast()
  const { data: session } = useSession()

  // Naming
  const [campaign, setCampaign] = useState(initialData?.campaign ?? "My_Campaign")
  const [placement, setPlacement] = useState(initialData?.placement ?? "Push_Expandable_970x250")
  const [targetElementId, setTargetElementId] = useState(initialData?.settings?.targetElementId ?? "")

  const isAdmin = useMemo(() => {
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
    return session?.user?.email && adminEmails.includes(session.user.email)
  }, [session])

  // Pricing & Budget
  const [cpm, setCpm] = useState<number>(initialData?.cpm || 5.0)
  const [budget, setBudget] = useState<number>(initialData?.budget || 100)

  // Params
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(initialData?.settings?.autoClose ?? "8")
  const [createClickLayer, setCreateClickLayer] = useState(true)
  const [clickTagUrl, setClickTagUrl] = useState(initialData?.settings?.click_tag ?? "https://cronista.com")
  const [transitionMs, setTransitionMs] = useState("250")
  const [expandAction, setExpandAction] = useState<ExpandAction>("click")

  // Dimensions
  const [customWidth, setCustomWidth] = useState(initialData?.settings?.width ?? 970)
  const [customCollapsedHeight, setCustomCollapsedHeight] = useState(initialData?.settings?.height ?? 90)
  const [customExpandedHeight, setCustomExpandedHeight] = useState(initialData?.settings?.expandedHeight ?? 250)

  // Sources (two uploads)
  const [collapsedSource, setCollapsedSource] = useState<SourceInfo | null>(null)
  const [collapsedUrl, setCollapsedUrl] = useState(initialData?.assets?.collapsed ?? "")
  const [expandedSource, setExpandedSource] = useState<SourceInfo | null>(null)
  const [expandedUrl, setExpandedUrl] = useState(initialData?.assets?.expanded ?? "")

  // Preview outputs (cropped)
  const [collapsedPreviewUrl, setCollapsedPreviewUrl] = useState<string>(initialData?.assets?.collapsed ?? "")
  const [expandedPreviewUrl, setExpandedPreviewUrl] = useState<string>(initialData?.assets?.expanded ?? "")

  // Output HTML (inspect)
  const [generatedHtml, setGeneratedHtml] = useState("")

  // Generated Embed Script
  const [embedScript, setEmbedScript] = useState("")

  // Feedback
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [isWorking, setIsWorking] = useState(false)

  const collapsedInputRef = useRef<HTMLInputElement | null>(null)
  const expandedInputRef = useRef<HTMLInputElement | null>(null)

  const [availableSlots, setAvailableSlots] = useState<UserProfile["availableSlots"]>([])

  useEffect(() => {
    if (session?.user?.email) {
      getUserProfile(session.user.email).then(profile => {
        if (profile?.availableSlots) {
          setAvailableSlots(profile.availableSlots)
        }
      })
    }
  }, [session])

  // Auto-sync CPM based on slot price if selection changes
  useEffect(() => {
    if (targetElementId && targetElementId !== "none") {
      const selectedSlot = availableSlots.find(s => s.id === targetElementId)
      if (selectedSlot && selectedSlot.price) {
        setCpm(selectedSlot.price)
      }
    }
  }, [targetElementId, availableSlots])

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
    setStatus("Reading image...")

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
    setStatus(`Auto-cropping ${kind}...`)
    const target = kind === "collapsed" ? { w: customWidth, h: customCollapsedHeight } : { w: customWidth, h: customExpandedHeight }
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

    setStatus(`${kind.toUpperCase()} ready: ${target.w}x${target.h}`)
    toast({ title: `${kind.toUpperCase()} loaded`, description: `Source ${info.w}x${info.h} -> output ${target.w}x${target.h}` })
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
    setEmbedScript("")

    if (!collapsedSource && !collapsedUrl) {
      setError("Missing collapsed image")
      return
    }
    if (!expandedSource && !expandedUrl) {
      setError("Missing expanded image")
      return
    }

    if (!session?.user?.email) {
      setError("User authentication required.")
      return
    }
    const userId = session.user.email

    try {
      setIsWorking(true)

      // 1. Prepare Blobs
      setStatus("Preparing assets...")
      let collapsedBlob: Blob
      if (collapsedSource) {
        collapsedBlob = await autoCropCoverToPngBlob(collapsedSource.file, customWidth, customCollapsedHeight)
      } else {
        collapsedBlob = await fetchAssetBlob(collapsedUrl)
      }

      let expandedBlob: Blob
      if (expandedSource) {
        expandedBlob = await autoCropCoverToPngBlob(expandedSource.file, customWidth, customExpandedHeight)
      } else {
        expandedBlob = await fetchAssetBlob(expandedUrl)
      }

      setStatus("Generating HTML & ZIP...")

      // 2. Generate HTML
      // Version A: For ZIP (Relative paths)
      const htmlForZip = generateadeliaHtmlFileBased({
        width: customWidth,
        collapsedHeight: customCollapsedHeight,
        expandedHeight: customExpandedHeight,
        clickTag: clickTagUrl.trim(),
        initExpanded: false,
        autoCloseSeconds: Number(autoCloseSeconds || 8),
        collapseSeconds: 0,
        expandAction,
        transitionMs: Number(transitionMs || 250),
        createClickLayer,
        collapsedFileNameInZip: collapsedNameInZip,
        expandedFileNameInZip: expandedNameInZip,
      })

      // Version B: For Cloud/Preview (Absolute paths)
      // When generating the "preview" HTML stored in Firebase, we want it to work standalone.
      // So we must use the actual public URLs if available, OR we can't fully support it 
      // until the files are uploaded. 
      // But we upload files first! 
      // So we need to re-generate the HTML after uploading assets to get their URLs?
      // Actually `uploadAdAsset` returns the public download URL.
      // So we can generate the "Cloud HTML" AFTER getting the image URLs.

      setGeneratedHtml(htmlForZip) // Preview in inspection shows ZIP version usually, or we can show cloud version.

      // 3. Create ZIP
      const manifest = {
        format: "push-expandable",
        version: "1.0.0",
        generated_at: new Date().toISOString(),
        settings: {
          campaign,
          placement,
          targetElementId,
          click_tag: clickTagUrl,
          width: customWidth,
          height: customCollapsedHeight,
          expandedHeight: customExpandedHeight
        }
      }

      const zipBlob = await createZipBlob(zipName, [
        { name: "index.html", data: htmlForZip },
        { name: collapsedNameInZip, data: collapsedBlob },
        { name: expandedNameInZip, data: expandedBlob },
        { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
      ])

      // TRIGGER DOWNLOAD
      const downloadUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = zipName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      // 4. Upload to Firebase (Keep this for records, but primary action is now download)
      setStatus("Uploading assets to cloud...")

      let newCollapsedUrl = collapsedUrl
      if (collapsedSource) {
        newCollapsedUrl = await uploadAdAsset(collapsedBlob, { userId, campaign, fileName: collapsedNameInZip })
      }

      let newExpandedUrl = expandedUrl
      if (expandedSource) {
        newExpandedUrl = await uploadAdAsset(expandedBlob, { userId, campaign, fileName: expandedNameInZip })
      }

      const zipUrl = await uploadAdAsset(zipBlob, { userId, campaign, fileName: zipName })

      // 0. Generate ID early for Tracking
      // We need a ref to get an Auto ID
      const newAdRef = doc(collection(db, "ads"));
      const docId = newAdRef.id;
      const trackingOrigin = window.location.origin;
      const trackingCode = TRACKING_SCRIPT
        .replace("[[AD_ID]]", docId)
        .replace("[[TRACK_URL]]", `${trackingOrigin}/api/track`);

      // Generate Cloud HTML with Absolute URLs
      const htmlForCloud = generateadeliaHtmlFileBased({
        width: customWidth,
        collapsedHeight: customCollapsedHeight,
        expandedHeight: customExpandedHeight,
        clickTag: clickTagUrl.trim(),
        initExpanded: false,
        autoCloseSeconds: Number(autoCloseSeconds || 8),
        collapseSeconds: 0,
        expandAction,
        transitionMs: Number(transitionMs || 250),
        createClickLayer,
        collapsedFileNameInZip: newCollapsedUrl, // Using Absolute URL!
        expandedFileNameInZip: newExpandedUrl,   // Using Absolute URL!
      })

      // Inject Tracking Script before </body>
      const htmlWithTracking = htmlForCloud.replace("</body>", `${trackingCode}\n</body>`);

      const htmlBlob = new Blob([htmlWithTracking], { type: "text/html" });
      const htmlUrl = await uploadAdAsset(htmlBlob, { userId, campaign, fileName: "index.html" });

      // 5. Save Record (using pre-generated ID)
      setStatus("Saving database record...")
      await saveAdRecord({
        userId,
        campaign,
        placement,
        type: "push-expandable",
        zipUrl,
        assets: {
          collapsed: newCollapsedUrl,
          expanded: newExpandedUrl
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
  d.style.height = "${customExpandedHeight}px"; 
  d.style.position = "relative";
  
  var clickMacro = "%%CLICK_URL_UNESC%%";
 
  var separator = "${htmlUrl}".includes("?") ? "&" : "?";
  
  var f = document.createElement("iframe");
  f.src = "${htmlUrl}" + separator + "clickTag=" + encodeURIComponent(clickMacro);
  f.width = "${customWidth}";
  f.height = "${customExpandedHeight}";
  f.style.border = "none";
  f.scrolling = "no";
  
  d.appendChild(f);
  document.currentScript.parentNode.insertBefore(d, document.currentScript);
})();
</script>`
      setEmbedScript(scriptCode)

      setStatus("Complete!")
      toast({ title: "Downloaded & Saved!", description: "ZIP downloaded and record saved to cloud." })

    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Error generating ad.")
      setStatus("")
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setIsWorking(false)
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript)
    toast({ title: "Copied!", description: "Embed script copied to clipboard." })
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
      {/* FORM */}
      <Card className="border-border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Naming */}
          <div className="space-y-2">
            <Label>Campaña(nombre)</Label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Ej: ACME_Q1_2026"
            />
          </div>

          <div className="space-y-2">
            <Label>Nombre del anuncio</Label>
            <Input
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              placeholder="Ej: HP_970x250_expandable"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label>CPM ($) {!isAdmin && "(Modo Lectura)"}</Label>
              <Input
                type="number"
                step="0.01"
                value={cpm}
                onChange={e => setCpm(parseFloat(e.target.value) || 0)}
                disabled={!isAdmin}
                className={!isAdmin ? "bg-muted" : ""}
              />
              <p className="text-[10px] text-muted-foreground font-medium">
                {isAdmin ? "Establece el costo por cada 1,000 impresiones." : "Costo definido por el administrador."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Presupuesto Total ($)</Label>
              <Input
                type="number"
                step="1"
                value={budget}
                onChange={e => setBudget(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[10px] text-muted-foreground font-medium">Presupuesto maximo para este anuncio.</p>
            </div>
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
            <Label>Duracion de transicion (ms)</Label>
            <Input
              value={transitionMs}
              onChange={(e) => setTransitionMs(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Accion de expansion</Label>
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
            <Label>Fuente Collapsed (cualquier tamano) - salida 970x90</Label>
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
                Fuente: {collapsedSource.w}x{collapsedSource.h} · {(collapsedSource.bytes / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {/* Uploads */}
          <div className="space-y-2">
            <Label>Fuente Expanded (cualquier tamano) - salida 970x250</Label>
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
                Fuente: {expandedSource.w}x{expandedSource.h} · {(expandedSource.bytes / 1024).toFixed(1)} KB
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
            {isWorking ? "Procesando..." : "Download ZIP & Save"}
          </Button>
        </form>
      </Card>

      {/* PREVIEW */}
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

        <Card className="border-border bg-card p-8 space-y-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Previsualizacion del recorte</h2>
          </div>

          {/* Collapsed preview */}
          <div className="space-y-2">
            <Label>Salida Collapsed (970x90)</Label>
            <div className="rounded-lg border bg-secondary/20 p-3">
              {collapsedPreviewUrl ? (
                <img
                  src={collapsedPreviewUrl}
                  alt="Previsualizacion collapsed"
                  className="block w-full rounded-md"
                  style={{ maxWidth: 970 }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Subi una fuente collapsed para ver la previsualizacion del recorte.
                </div>
              )}
            </div>
          </div>

          {/* Expanded preview */}
          <div className="space-y-2">
            <Label>Salida Expanded (970x250)</Label>
            <div className="rounded-lg border bg-secondary/20 p-3">
              {expandedPreviewUrl ? (
                <img
                  src={expandedPreviewUrl}
                  alt="Previsualizacion expanded"
                  className="block w-full rounded-md"
                  style={{ maxWidth: 970 }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Subi una fuente expanded para ver la previsualizacion del recorte.
                </div>
              )}
            </div>
          </div>

        </Card>
      </div>
    </div>
  )
}
