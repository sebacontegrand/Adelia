"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sun, Cloud, CloudRain, CloudLightning, MapPin } from "lucide-react"

export function Footer() {
    const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null)

    useEffect(() => {
        async function fetchWeather() {
            try {
                // Fetch weather for Buenos Aires using wttr.in (format 1: temp + condition)
                const response = await fetch("https://wttr.in/Buenos+Aires?format=%t+%C")
                if (response.ok) {
                    const text = await response.text()
                    const [temp, ...conditionArr] = text.split(" ")
                    const condition = conditionArr.join(" ").toLowerCase()

                    let icon = "☀️"
                    if (condition.includes("cloud") || condition.includes("overcast")) icon = "☁️"
                    if (condition.includes("rain") || condition.includes("drizzle")) icon = "🌧️"
                    if (condition.includes("snow")) icon = "❄️"
                    if (condition.includes("thunder")) icon = "⚡"

                    setWeather({ temp, icon })
                }
            } catch (error) {
                console.error("Failed to fetch weather:", error)
            }
        }

        fetchWeather()
    }, [])

    return (
        <footer className="w-full border-t border-white/5 bg-black/40 backdrop-blur-xl py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left Side: Copyright & Copyright */}
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <span className="text-sm text-white/40 font-medium">
                            © 2026 Adelia Ad Platform
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-white/20">
                            <MapPin className="h-3 w-3" />
                            <span>Buenos Aires, AR</span>
                            <span className="opacity-50">·</span>
                            <span className="flex items-center gap-1.5 font-medium text-emerald-500/80">
                                {weather ? `${weather.icon} ${weather.temp}` : "🌤 24 °C"}
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/privacy"
                            className="text-xs text-white/40 hover:text-white transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-xs text-white/40 hover:text-white transition-colors"
                        >
                            Terms
                        </Link>
                        <Link
                            href="/cookies"
                            className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2"
                        >
                            Cookies
                            <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                                In Progress
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
