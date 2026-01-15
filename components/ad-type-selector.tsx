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
}

export function AdTypeSelector({ options, selectedId, onSelect }: AdTypeSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
              "bg-card text-card-foreground flex flex-col gap-3 rounded-xl border px-6 py-5 text-left shadow-sm transition",
              isSelected && "border-primary ring-2 ring-primary/30",
              isEnabled && "hover:shadow-md hover:-translate-y-0.5",
              !isEnabled && "cursor-not-allowed opacity-60",
            )}
            aria-pressed={isSelected}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{option.title}</span>
                {option.status === "live" ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Coming
                  </Badge>
                )}
              </div>
              {isSelected && <span className="text-xs font-medium text-primary">Seleccionado</span>}
            </div>
            <p className="text-sm text-muted-foreground">{option.description}</p>
            {option.dimensions && <p className="text-xs text-muted-foreground">Size: {option.dimensions}</p>}
          </button>
        )
      })}
    </div>
  )
}
