import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Lock, Layout, Puzzle, Palette, Mic, ImageIcon, MousePointer2, Sun, Maximize, Monitor, Sidebar, Scroll, Video, Gamepad2, Layers, MessagesSquare } from "lucide-react"

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
  variant?: "grid" | "sidebar" | "compact"
}

const getIcon = (id: string) => {
  switch (id) {
    case 'push-expandable': return Layout;
    case 'puzzle-300': return Puzzle;
    case 'colorad-300': return Palette;
    case 'podcastwith-300': return Mic;
    case 'native-display': return ImageIcon;
    case 'scratch-off-300': return MousePointer2;
    case 'parallax-banner': return Sun;
    case 'interstitial-full': return Maximize;
    case 'desktop-skin': return Monitor;
    case 'side-rail': return Sidebar;
    case 'interscroller-desktop': return Scroll;
    case 'native-video': return Video;
    case 'mini-game-gated': return Gamepad2;
    case 'vertical-gallery': return Layers;
    case 'text-dialogue': return MessagesSquare;
    default: return Layout;
  }
}

export function AdTypeSelector({ options, selectedId, onSelect, variant = "grid" }: AdTypeSelectorProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2 items-center py-2">
        {options.map((option) => {
          const isSelected = option.id === selectedId
          const isEnabled = option.status === "live"
          const Icon = getIcon(option.id)

          return (
            <button
              key={option.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all relative group",
                isSelected ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-muted/50 hover:bg-muted text-muted-foreground",
                !isEnabled && "opacity-30 cursor-not-allowed"
              )}
              title={option.title}
            >
              <Icon className="h-5 w-5" />
              {isSelected && (
                <div className="absolute -right-1 -top-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950" />
              )}
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 border border-white/10 text-white text-[11px] font-medium rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 transform translate-x-2 group-hover:translate-x-0 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {option.title}
                {/* Arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-right-slate-900"
                  style={{ borderRightColor: 'rgb(15, 23, 42)', marginRight: '-1px' }} />
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn(
      "grid gap-3",
      variant === "grid" ? "md:grid-cols-2" : "grid-cols-1"
    )}>
      {options.map((option) => {
        const isSelected = option.id === selectedId
        const isEnabled = option.status === "live"
        const Icon = getIcon(option.id)

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
                <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
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
