"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles } from "lucide-react"

type NavbarProps = {
  // onSignOut is now optional/deprecated as Navbar handles it internally via NextAuth
  onSignOut?: () => void
  logoAction?: "home" | "signout"
}

export function Navbar({ onSignOut, logoAction = "home" }: NavbarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
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
    { href: "/", label: "Home" },
    { href: "/formats", label: "Formats" },
    { href: "/ad-builder", label: "Ad Builder" },
    ...(isAdmin ? [
      { href: "/media-kit-settings", label: "Media Kit" },
      { href: "/admin", label: "Admin Dashboard" }
    ] : []),
    { href: "/chat", label: "Adelia Assistant", icon: Sparkles },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
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

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
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
              Sign Out
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
