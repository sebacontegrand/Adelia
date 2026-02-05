"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { minifyScript } from "./utils"

interface AdScriptResultProps {
    script: string
    title?: string
    description?: string
}

export function AdScriptResult({
    script,
    title = "Ad Ready!",
    description = "Copy and paste this script into your website to embed the ad."
}: AdScriptResultProps) {
    const { toast } = useToast()

    const handleCopy = (oneLine = false) => {
        const textToCopy = oneLine ? minifyScript(script) : script
        navigator.clipboard.writeText(textToCopy)
        toast({
            title: "Copied!",
            description: `${oneLine ? "One-line" : "Embed"} script copied to clipboard.`
        })
    }

    if (!script) return null

    return (
        <Card className="border-border bg-card p-6 border-emerald-500/50 bg-emerald-500/5 transition-all animate-in zoom-in-95">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
                    {title}
                </h3>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(false)} className="gap-2">
                        <Copy className="h-4 w-4" /> Copy Script
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(true)} className="gap-2 border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Copy className="h-4 w-4" /> Copy One-Line
                    </Button>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                {description}
            </p>
            <textarea
                className="w-full h-32 p-3 font-mono text-xs border rounded-md bg-slate-950 text-slate-50 focus:ring-2 focus:ring-emerald-500 resize-none"
                readOnly
                value={script}
            />
        </Card>
    )
}
