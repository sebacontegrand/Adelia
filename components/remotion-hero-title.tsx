"use client"

import { useEffect, useState } from "react"
import { Player } from "@remotion/player"
import { AnimatedTitle } from "@/components/AnimatedTitle"

export function RemotionHeroTitle() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Fallback for SSR
        return (
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Design the Future of{" "}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Digital Creatives
                </span>
            </h2>
        )
    }

    return (
        <div className="w-full relative min-h-[100px] lg:min-h-[140px]">
            <Player
                component={AnimatedTitle}
                durationInFrames={150}
                compositionWidth={1200}
                compositionHeight={300}
                fps={30}
                style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "1200 / 300",
                }}
                loop
                autoPlay
                controls={false}
                inputProps={{}}
            />
        </div>
    )
}
