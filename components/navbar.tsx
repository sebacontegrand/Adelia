"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, ExternalLink, Menu } from "lucide-react"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/app/context/language-context"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type NavbarProps = {
  // onSignOut is now optional/deprecated as Navbar handles it internally via NextAuth
  onSignOut?: () => void
  logoAction?: "home" | "signout"
}

export function Navbar({ onSignOut, logoAction = "home" }: NavbarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const isAuthenticated = status === "authenticated"

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    } else {
      signOut()
    }
  }

  // Admin Check for Navbar
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email)

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/formats", label: t("nav.formats") },
    { href: "/ad-builder", label: t("nav.ad_builder") },
    ...(isAdmin ? [
      { href: "/media-kit-settings", label: t("nav.media_kit") },
      { href: "/admin", label: t("nav.admin") }
    ] : []),
    { href: "/chat", label: "Adelia Assistant", icon: Sparkles },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      {/* DESKTOP NAVBAR (Default VISIBLE, hides on mobile) */}
      <div className="container mx-auto flex max-md:hidden h-28 items-center justify-between px-4">
        {logoAction === "signout" && isAuthenticated ? (
          <button type="button" onClick={handleSignOut} className="flex items-center gap-2">
            <img
              src="/adelia%20(4).png"
              alt="Adelia"
              className="h-[96px] w-[300px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            />
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/adelia%20(4).png"
              alt="Adelia"
              className="h-[96px] w-[300px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            />
          </Link>
        )}

        <div className="flex items-center gap-6 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${pathname === item.href ? "text-white" : "text-white/70"
                }`}
            >
              {item.icon && <item.icon className="w-4 h-4 text-blue-400" />}
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://adelia-tools.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 rounded-full transition-all hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("nav.adelia_tools")}
          </Link>
          <LanguageToggle />
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                  <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">
                  {session?.user?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t("nav.sign_out")}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* MOBILE NAVBAR (Default VISIBLE, hides on desktop) */}
      <div className="container mx-auto flex md:hidden h-20 items-center justify-between px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-black border-white/10 text-white w-[280px] p-0">
              <SheetHeader className="p-6 border-b border-white/10 text-left">
                <SheetTitle className="text-white flex items-center gap-2">
                  <img src="/adelia%20(4).png" alt="Adelia" className="h-8 object-contain" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors hover:bg-white/5 ${pathname === item.href ? "text-blue-400 bg-white/5 font-bold" : "text-white/70"}`}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <div className="mt-auto p-6 border-t border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{session?.user?.name}</span>
                        <span className="text-xs text-white/50">{session?.user?.email}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10" onClick={handleSignOut}>
                      {t("nav.sign_out")}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Logo with logic */}
          {logoAction === "signout" && isAuthenticated ? (
            <button type="button" onClick={handleSignOut} className="flex items-center">
              <img src="/adelia%20(4).png" alt="Adelia" className="h-10 w-auto object-contain" />
            </button>
          ) : (
            <Link href="/" className="flex items-center">
              <img src="/adelia%20(4).png" alt="Adelia" className="h-10 w-auto object-contain" />
            </Link>
          )}
        </div>

        {/* Right: Tools + Lang */}
        <div className="flex items-center gap-2">
          <Link
            href="https://adelia-tools.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2 py-1 rounded-full"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden xs:inline-block">Tools</span>
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  )
}
