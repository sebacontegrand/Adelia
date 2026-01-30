"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/app/context/language-context"
import { Globe } from "lucide-react"

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage()

    return (
        <Button
            variant="ghost"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            title={language === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
            className="text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 px-3 min-w-[70px]"
        >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-bold">{language.toUpperCase()}</span>
        </Button>
    )
}
