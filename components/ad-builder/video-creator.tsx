"use client"

import { useState } from "react"
import { Player } from "@remotion/player"
import { AdVideo } from "@/remotion/AdVideo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, Settings2, Download, Copy, Play, Terminal, Sparkles, Loader2, Info, Upload, X, MousePointer2, Image as ImageIcon, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { useSession } from "next-auth/react"
import { saveVideoRecord, type VideoRecord } from "@/firebase/firestore"

export function VideoCreator() {
    const { toast } = useToast()
    const { data: session } = useSession()
    const [projectId, setProjectId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [campaign, setCampaign] = useState("") // Project Name
    const [initialData, setInitialData] = useState<VideoRecord | null>(null)

    // Video Parameters
    const [headline, setHeadline] = useState("Summertime Special")
    const [subtext, setSubtext] = useState("50% OFF - This Week Only")
    const [brandColor, setBrandColor] = useState("#d4af37")
    const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1920")
    const [logo, setLogo] = useState<string>("")
    const [ctaText, setCtaText] = useState("Shop Now")
    const [overlayOpacity, setOverlayOpacity] = useState(0.6)

    // Video Config Properties
    const [width, setWidth] = useState(1920)
    const [height, setHeight] = useState(1080)
    const [durationInFrames, setDurationInFrames] = useState(150)
    const [fps, setFps] = useState(30)

    // Animation Timing
    const [headlineStartFrame, setHeadlineStartFrame] = useState(0)
    const [subtextStartFrame, setSubtextStartFrame] = useState(25)
    const [ctaStartFrame, setCtaStartFrame] = useState(50)

    // Advanced Styling
    const [fontFamily, setFontFamily] = useState('Helvetica, Arial, sans-serif')
    const [bgBlur, setBgBlur] = useState(0)
    const [bgGrayscale, setBgGrayscale] = useState(false)
    const [gradientDirection, setGradientDirection] = useState<'top-to-bottom' | 'left-to-right' | 'radial'>('top-to-bottom')
    const [animationStyle, setAnimationStyle] = useState<'cinematic' | 'fast' | 'minimal'>('cinematic')
    const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center')
    const [showSafeZones, setShowSafeZones] = useState(false)
    const [showProgressBar, setShowProgressBar] = useState(false)
    const [logoPosition, setLogoPosition] = useState<'top-left' | 'top-right' | 'center' | 'bottom-right'>('center')
    const [ctaMarginBottom, setCtaMarginBottom] = useState(60)

    const fonts = [
        { name: 'Modern Sans', value: 'Inter, system-ui, sans-serif' },
        { name: 'Classic Serif', value: 'Georgia, serif' },
        { name: 'Punchy Mono', value: 'ui-monospace, monospace' },
        { name: 'Elegant', value: 'Playfair Display, serif' }
    ]

    // Background Presets
    const presets = [
        { name: "Luxury", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1920", color: "#d4af37" },
        { name: "Tech", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920", color: "#00f2ff" },
        { name: "Cozy", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1920", color: "#f59e0b" },
    ]

    // Refs
    const bgInputRef = useRef<HTMLInputElement>(null)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [prompt, setPrompt] = useState("")

    // Command generation
    const renderCommand = `npx remotion render remotion/index.tsx AdVideo out/video.mp4 --width=${width} --height=${height} --fps=${fps} --props='${JSON.stringify({
        headline,
        subtext,
        brandColor,
        bgImage,
        logo,
        ctaText,
        overlayOpacity,
        headlineStartFrame,
        subtextStartFrame,
        ctaStartFrame,
        fontFamily,
        bgBlur,
        bgGrayscale,
        gradientDirection,
        animationStyle,
        textAlignment,
        showSafeZones,
        showProgressBar,
        logoPosition,
        ctaMarginBottom
    })}'`

    const handleAIGenerate = async () => {
        if (!prompt) {
            toast({ title: "Enter a prompt", description: "Tell Adelia what kind of ad you want to create.", variant: "destructive" })
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: `Generate a short ad video concept for: "${prompt}". \nReturn ONLY a JSON object with this structure: \n{"headline": "Maximum 25 chars", "subtext": "Maximum 40 chars", "ctaText": "Max 12 chars", "brandColor": "hex code"}.\nNo other text.`
                    }]
                })
            });

            if (!response.ok) throw new Error('API_FAILED');

            const text = await response.text();
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                const data = JSON.parse(jsonStr);
                setHeadline(data.headline);
                setSubtext(data.subtext);
                if (data.ctaText) setCtaText(data.ctaText);
                setBrandColor(data.brandColor || "#10b981");
                toast({ title: "Creatives Generated!", description: "Headline and Subtext updated with AI magic." });
            } else {
                throw new Error('INVALID_JSON');
            }
        } catch (error) {
            console.error("AI Generation Error:", error);

            // Smart Local Fallback
            const lowerPrompt = prompt.toLowerCase();
            let fallbackData = {
                headline: "Limited Edition",
                subtext: "Experience the difference today",
                ctaText: "Shop Now",
                brandColor: "#10b981"
            };

            if (lowerPrompt.includes('watch') || lowerPrompt.includes('luxury') || lowerPrompt.includes('gold')) {
                fallbackData = { headline: "Luxury Redefined", subtext: "Elegance in every second", ctaText: "Explore", brandColor: "#d4af37" };
            } else if (lowerPrompt.includes('coffee') || lowerPrompt.includes('cafe') || lowerPrompt.includes('cozy')) {
                fallbackData = { headline: "Morning Ritual", subtext: "Freshly brewed for you", ctaText: "Order Now", brandColor: "#f59e0b" };
            } else if (lowerPrompt.includes('tech') || lowerPrompt.includes('digital') || lowerPrompt.includes('app')) {
                fallbackData = { headline: "Future Forward", subtext: "Next-gen innovation is here", ctaText: "Download", brandColor: "#00f2ff" };
            } else if (lowerPrompt.includes('sale') || lowerPrompt.includes('off') || lowerPrompt.includes('discount')) {
                fallbackData = { headline: "Flash Sale", subtext: "Don't miss out - 50% OFF", ctaText: "Claim Deal", brandColor: "#ef4444" };
            }

            setHeadline(fallbackData.headline);
            setSubtext(fallbackData.subtext);
            setCtaText(fallbackData.ctaText);
            setBrandColor(fallbackData.brandColor);

            toast({
                title: "Local Creative Used",
                description: "AI generation failed. Using local design engine to fulfill your request.",
                variant: "default"
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'bg' | 'logo') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (target === 'bg') {
                    setBgImage(reader.result as string);
                } else {
                    setLogo(reader.result as string);
                }
                toast({ title: "Image Uploaded", description: "Your custom asset is ready." });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyCommand = () => {
        navigator.clipboard.writeText(renderCommand)
        toast({ title: "Command Copied!", description: "Run this in your terminal to render the video." })
    }

    const handleSave = async () => {
        if (!campaign || !session?.user?.email) {
            toast({
                title: "Missing Information",
                description: "Please enter a Project Name and ensure you are logged in.",
                variant: "destructive",
            })
            return
        }

        console.log("Saving project:", campaign, "User:", session?.user?.email)
        setIsSaving(true)
        try {
            const videoData: VideoRecord = {
                userId: session!.user!.email!,
                name: campaign,
                settings: {
                    headline,
                    subtext,
                    brandColor,
                    bgImage,
                    logo,
                    ctaText,
                    overlayOpacity,
                    headlineStartFrame,
                    subtextStartFrame,
                    ctaStartFrame,
                    fontFamily,
                    bgBlur,
                    bgGrayscale,
                    gradientDirection,
                    animationStyle,
                    textAlignment,
                    showSafeZones,
                    showProgressBar,
                    logoPosition,
                    ctaMarginBottom,
                    fps,
                    durationInFrames,
                    width,
                    height
                }
            }

            console.log("Video data prepared:", videoData)
            const id = await saveVideoRecord(videoData, initialData?.id)
            console.log("Save successful! ID:", id)

            setProjectId(id)
            toast({
                title: "Project Saved to Library",
                description: "Your video configuration is now in the Adelia Video Library.",
            })
        } catch (error) {
            console.error("CRITICAL: Failed to save video project", error)
            toast({
                title: "Error",
                description: "No se pudo guardar el proyecto de video. Revisa la consola para más detalles.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
            {/* Editor Sidebar */}
            <div className="lg:col-span-5 space-y-6">
                <Card className="border-border bg-card border-emerald-500/20 bg-emerald-500/5 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-500">
                            <Sparkles className="h-5 w-5" />
                            AI Magic Prompt
                        </CardTitle>
                        <CardDescription>
                            Describe your ad and let Adelia generate the content for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. A luxury watch ad with a gold theme"
                                className="bg-background border-emerald-500/30 focus:ring-emerald-500"
                            />
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all shadow-md active:scale-95"
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {isGenerating ? "Generating..." : "Generate Creative"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-emerald-500" />
                            Manual Designer
                        </CardTitle>
                        <CardDescription>
                            Fine-tune the generated content or build from scratch.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</Label>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Headline</Label>
                                    <Input
                                        value={headline}
                                        onChange={(e) => setHeadline(e.target.value)}
                                        placeholder="Large Impact Text"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtext</Label>
                                    <Input
                                        value={subtext}
                                        onChange={(e) => setSubtext(e.target.value)}
                                        placeholder="Call to action"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MousePointer2 className="h-4 w-4 text-emerald-500" />
                                        CTA Button Text
                                    </Label>
                                    <Input
                                        value={ctaText}
                                        onChange={(e) => setCtaText(e.target.value)}
                                        placeholder="Shop Now, Learn More..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branding</Label>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label>Overlay Intensity</Label>
                                        <span className="text-[10px] font-mono text-muted-foreground">{Math.round(overlayOpacity * 100)}%</span>
                                    </div>
                                    <Slider
                                        value={[overlayOpacity * 100]}
                                        onValueChange={(vals) => setOverlayOpacity(vals[0] / 100)}
                                        max={100}
                                        step={1}
                                        className="py-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Brand Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={brandColor}
                                                onChange={(e) => setBrandColor(e.target.value)}
                                                className="w-12 h-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={brandColor}
                                                onChange={(e) => setBrandColor(e.target.value)}
                                                className="flex-1 font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format & Dimensions</Label>

                            <div className="flex gap-1 mb-2">
                                {[
                                    { label: 'Landscape', w: 1920, h: 1080, icon: Video },
                                    { label: 'Portrait', w: 1080, h: 1920, icon: Play },
                                    { label: 'Square', w: 1080, h: 1080, icon: ImageIcon },
                                ].map((p) => (
                                    <Button
                                        key={p.label}
                                        variant={width === p.w && height === p.h ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 flex-1 text-[10px] gap-1"
                                        onClick={() => {
                                            setWidth(p.w)
                                            setHeight(p.h)
                                        }}
                                    >
                                        <p.icon className="h-3 w-3" />
                                        {p.label}
                                    </Button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Width</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={width}
                                        onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                                        className="h-8 text-[10px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Height</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={height}
                                        onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                                        className="h-8 text-[10px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Duration (f)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={durationInFrames}
                                        onChange={(e) => setDurationInFrames(Math.max(1, Number(e.target.value)))}
                                        className="h-8 text-[10px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">FPS</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={fps}
                                        onChange={(e) => setFps(Math.max(1, Number(e.target.value)))}
                                        className="h-8 text-[10px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Typography & Style</Label>

                            <div className="space-y-2">
                                <Label className="text-[10px]">Font Family</Label>
                                <select
                                    className="w-full bg-background border border-input rounded-md h-8 text-xs px-2"
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                >
                                    {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Background Blur</Label>
                                    <Slider
                                        value={[bgBlur]}
                                        max={20}
                                        step={1}
                                        onValueChange={([v]) => setBgBlur(v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-4">
                                    <Label className="text-[10px]">Grayscale</Label>
                                    <input
                                        type="checkbox"
                                        checked={bgGrayscale}
                                        onChange={(e) => setBgGrayscale(e.target.checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout & Composition</Label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Alignment</Label>
                                    <div className="flex gap-1">
                                        {(['left', 'center', 'right'] as const).map(a => (
                                            <Button
                                                key={a}
                                                variant={textAlignment === a ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-7 flex-1 text-[10px] capitalize"
                                                onClick={() => setTextAlignment(a)}
                                            >
                                                {a}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Logo Position</Label>
                                    <select
                                        className="w-full bg-background border border-input rounded-md h-8 text-xs px-2"
                                        value={logoPosition}
                                        onChange={(e) => setLogoPosition(e.target.value as any)}
                                    >
                                        <option value="center">Center</option>
                                        <option value="top-left">Top Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="bottom-right">Bottom Right</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px]">Gradient Flow</Label>
                                <div className="flex gap-1">
                                    {(['top-to-bottom', 'left-to-right', 'radial'] as const).map(d => (
                                        <Button
                                            key={d}
                                            variant={gradientDirection === d ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-7 flex-1 text-[10px] capitalize"
                                            onClick={() => setGradientDirection(d)}
                                        >
                                            {d.split('-').join(' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Animation Style</Label>
                            <div className="flex gap-1">
                                {(['cinematic', 'fast', 'minimal'] as const).map(s => (
                                    <Button
                                        key={s}
                                        variant={animationStyle === s ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 flex-1 text-[10px] capitalize"
                                        onClick={() => setAnimationStyle(s)}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advanced timing</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Headline</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={headlineStartFrame}
                                        onChange={(e) => setHeadlineStartFrame(Math.max(0, Number(e.target.value)))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Subtext</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={subtextStartFrame}
                                        onChange={(e) => setSubtextStartFrame(Math.max(0, Number(e.target.value)))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px]">CTA</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={ctaStartFrame}
                                        onChange={(e) => setCtaStartFrame(Math.max(0, Number(e.target.value)))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Extras & Guides</Label>
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px]">Show Safe Zones</Label>
                                <input type="checkbox" checked={showSafeZones} onChange={e => setShowSafeZones(e.target.checked)} />
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <Label className="text-[10px]">Show Progress Bar</Label>
                                <input type="checkbox" checked={showProgressBar} onChange={e => setShowProgressBar(e.target.checked)} />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assets</Label>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                                    Background Image
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={bgImage.startsWith('data:') ? 'Custom Uploaded Image' : bgImage}
                                        onChange={(e) => setBgImage(e.target.value)}
                                        placeholder="URL or Upload"
                                        className="flex-1 text-xs"
                                        disabled={bgImage.startsWith('data:')}
                                    />
                                    {bgImage.startsWith('data:') ? (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setBgImage(presets[0].url)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                ref={bgInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'bg')}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => bgInputRef.current?.click()}
                                            >
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Premium Presets</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {presets.map((p) => (
                                        <Button
                                            key={p.name}
                                            variant="outline"
                                            size="sm"
                                            className={`h-9 text-[10px] border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 ${bgImage === p.url ? 'bg-emerald-500/10 border-emerald-500' : ''}`}
                                            onClick={() => { setBgImage(p.url); setBrandColor(p.color); }}
                                        >
                                            {p.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-border pt-4">
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                                    Brand Logo
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={logo.startsWith('data:') ? 'Custom Brand Logo' : logo}
                                        onChange={(e) => setLogo(e.target.value)}
                                        placeholder="Logo URL or Upload"
                                        className="flex-1 text-xs"
                                        disabled={logo.startsWith('data:')}
                                    />
                                    {logo.startsWith('data:') ? (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setLogo("")}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                ref={logoInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'logo')}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => logoInputRef.current?.click()}
                                            >
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border mt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Library Settings</Label>
                                <Input
                                    placeholder="Project Name (e.g. Summer Promo 2026)"
                                    value={campaign}
                                    onChange={(e) => setCampaign(e.target.value)}
                                    className="h-10 border-emerald-500/20 focus-visible:ring-emerald-500"
                                />
                            </div>

                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 shadow-lg shadow-emerald-900/20"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSaving ? "Saving..." : "Save to Adelia Library"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-8">
                <Card className="border-border bg-card overflow-hidden shadow-2xl">
                    <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="font-bold text-sm tracking-tight">Live Cinema Preview</h3>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Play className="h-3 w-3" /> Cinematic Preview
                        </div>
                    </div>
                    <div className="bg-black relative flex items-center justify-center p-4 h-[600px] overflow-hidden group">
                        <div
                            style={{
                                aspectRatio: `${width}/${height}`,
                                height: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                maxWidth: '100%'
                            }}
                            className="relative shadow-2xl ring-1 ring-white/10"
                        >
                            <Player
                                component={AdVideo as any}
                                durationInFrames={durationInFrames}
                                compositionWidth={width}
                                compositionHeight={height}
                                fps={fps}
                                style={{
                                    width: '100%',
                                }}
                                controls
                                inputProps={{
                                    headline,
                                    subtext,
                                    brandColor,
                                    bgImage,
                                    logo,
                                    ctaText,
                                    overlayOpacity,
                                    headlineStartFrame,
                                    subtextStartFrame,
                                    ctaStartFrame,
                                    fontFamily,
                                    bgBlur,
                                    bgGrayscale,
                                    gradientDirection,
                                    animationStyle,
                                    textAlignment,
                                    showSafeZones,
                                    showProgressBar,
                                    logoPosition,
                                    ctaMarginBottom
                                }}
                            />
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border-border bg-card flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center">
                            <Video className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</p>
                            <p className="text-sm font-semibold">{width}x{height} ({width === height ? '1:1' : width > height ? 'Landscape' : 'Portrait'})</p>
                        </div>
                    </Card>
                    <Card className="p-4 border-border bg-card flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center">
                            <Download className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output</p>
                            <p className="text-sm font-semibold">H.264 MP4</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    )
}
