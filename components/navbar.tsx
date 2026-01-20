"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

type NavbarProps = {
  onSignOut?: () => void
  logoAction?: "home" | "signout"
}

export function Navbar({ onSignOut, logoAction = "home" }: NavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/formats", label: "Formats" },
    { href: "/ad-builder", label: "Ad Builder" },
    { href: "/chat", label: "Chat" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        {logoAction === "signout" && onSignOut ? (
          <button type="button" onClick={onSignOut} className="flex items-center gap-2">
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
              className={`text-sm font-medium transition-colors hover:text-white ${
                pathname === item.href ? "text-white" : "text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {onSignOut ? (
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Sign Out
          </Button>
        ) : null}
      </div>
    </nav>
  )
}
