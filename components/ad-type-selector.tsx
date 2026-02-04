"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Lock } from "lucide-react"

export type AdTypeOption = {
  id: string
  title: string
  description: string
  dimensions?: string
  status: "live" | "coming"
}

type AdTypeSelectorProps = {
  options: AdTypeOption[]
  selectedId: string
  onSelect: (id: string) => void
  variant?: "grid" | "sidebar"
}

export function AdTypeSelector({ options, selectedId, onSelect, variant = "grid" }: AdTypeSelectorProps) {
  return (
    <div className={cn(
      "grid gap-4",
      variant === "grid" ? "md:grid-cols-2" : "grid-cols-1"
    )}>
      {options.map((option) => {
        const isSelected = option.id === selectedId
        const isEnabled = option.status === "live"

        return (
          <button
            key={option.id}
            type="button"
            disabled={!isEnabled}
            onClick={() => onSelect(option.id)}
            className={cn(
              "bg-card text-card-foreground flex flex-col gap-2 rounded-xl border px-5 py-4 text-left shadow-sm transition",
              variant === "sidebar" && "px-4 py-3 gap-1",
              isSelected && "border-primary ring-2 ring-primary/30 bg-primary/5",
              isEnabled && "hover:shadow-md hover:-translate-y-0.5",
              !isEnabled && "cursor-not-allowed opacity-60",
            )}
            aria-pressed={isSelected}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold",
                  variant === "sidebar" ? "text-xs" : "text-sm"
                )}>{option.title}</span>
                {isEnabled ? (
                  variant === "grid" && (
                    <Badge variant="default" className="gap-1 px-1.5 h-5 text-[10px]">
                      <Check className="h-2.5 w-2.5" />
                      Live
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary" className="gap-1 px-1.5 h-5 text-[10px]">
                    <Lock className="h-2.5 w-2.5" />
                    {variant === "sidebar" ? "" : "Coming"}
                  </Badge>
                )}
              </div>
              {isSelected && variant === "grid" && <span className="text-[10px] font-medium text-primary">Seleccionado</span>}
            </div>
            {variant === "grid" && <p className="text-sm text-muted-foreground line-clamp-2">{option.description}</p>}
            {option.dimensions && (
              <p className={cn(
                "text-muted-foreground",
                variant === "sidebar" ? "text-[9px]" : "text-xs"
              )}>Size: {option.dimensions}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
