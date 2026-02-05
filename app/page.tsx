"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { useLanguage } from "@/app/context/language-context"
import { Sparkles } from "lucide-react"
import { RemotionHeroTitle } from "@/components/remotion-hero-title"

export default function HomePage() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  const [showIntro, setShowIntro] = useState(false)

  const handleGoogleLogin = () => {
    signIn("google")
  }

  const handleSignOut = () => {
    signOut()
  }

  useEffect(() => {
    // Only check for intro seen, auth is handled by NextAuth
    const introSeen = window.localStorage.getItem("adelia_intro_seen")
    if (introSeen !== "true") setShowIntro(true)
  }, [])

  const handleVisitorContinue = () => {
    window.localStorage.setItem("adelia_intro_seen", "true")
    setShowIntro(false)
  }

  if (isLoading) {
    return null // Or a loading spinner
  }

  // Show intro only if not authenticated and intro not seen
  if (!isAuthenticated && showIntro) {
    return (
      <div
        className="relative min-h-screen cursor-pointer overflow-hidden bg-white"
        onClick={handleVisitorContinue}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleVisitorContinue()
        }}
      >
        <img
          src="/screenfull.png"
          alt="Adelia"
          className="absolute inset-0 h-full w-full object-contain"
        />
        <div className="relative z-10 flex min-h-screen items-center justify-end px-8">
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow">
            {t("home.click_enter")}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar onSignOut={isAuthenticated ? handleSignOut : undefined} />

      {!isAuthenticated && (
        <section id="login" className="relative flex items-center justify-center px-4 py-20">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="grid h-full grid-cols-3 gap-2 p-4">
              <img src="/new-york-times-newspaper-front-page.jpg" alt="" className="h-full w-full object-cover" />
              <img src="/wall-street-journal-newspaper.jpg" alt="" className="h-full w-full object-cover" />
              <img src="/financial-times-newspaper.jpg" alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <Card className="relative z-10 w-full max-w-md border-border bg-card/90 p-8 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold text-balance">{t("home.welcome")}</h1>
              <p className="text-muted-foreground text-balance">
                {t("home.welcome.desc")}
              </p>
            </div>

            <Button onClick={handleGoogleLogin} className="w-full" size="lg">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("home.login")}
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>{t("home.secure_auth")}</p>
            </div>
          </Card>
        </section>
      )}

      <main className="container mx-auto px-4 py-12">
        {/* Future Showcase Section */}
        <section className="mb-20 overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 lg:p-16 space-y-6">

              <RemotionHeroTitle />
              <p className="text-lg text-white/60 leading-relaxed">
                Adelia's advanced engine powers high-impact formats that redefine user engagement.
                Experience the perfect blend of performance and aesthetics.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <Link href="/formats" className="group">
                  <div className="space-y-3">
                    <Button className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12 text-sm font-semibold transition-all group-hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                      {t("home.card.formats.title")}
                    </Button>
                    <p className="text-[11px] leading-relaxed text-white/40 px-1 group-hover:text-white/70 transition-colors line-clamp-2">
                      {t("home.card.formats.desc")}
                    </p>
                  </div>
                </Link>

                <Link href="/ad-builder" className="group">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full cursor-pointer rounded-xl px-6 h-12 text-sm font-semibold border-white/10 bg-white/5 hover:bg-white/10 transition-all group-hover:scale-[1.02] text-white">
                      {t("home.card.builder.title")}
                    </Button>
                    <p className="text-[11px] leading-relaxed text-white/40 px-1 group-hover:text-white/70 transition-colors line-clamp-2">
                      {t("home.card.builder.desc")}
                    </p>
                  </div>
                </Link>

                <Link href="/chat" className="group">
                  <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                    <Button variant="ghost" className="w-full cursor-pointer rounded-xl px-6 h-12 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all group-hover:scale-[1.02]">
                      {t("home.card.support.title")}
                    </Button>
                    <p className="text-[11px] leading-relaxed text-white/40 px-1 group-hover:text-white/70 transition-colors line-clamp-2">
                      {t("home.card.support.desc")}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[600px] w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10 md:hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 hidden md:block" />
              <img
                src="/future.png"
                alt="The Future of Adelia"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
