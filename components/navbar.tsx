"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

type NavbarProps = {
  onSignOut?: () => void
}

export function Navbar({ onSignOut }: NavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/formats", label: "Formats" },
    { href: "/ad-builder", label: "Ad Builder" },
    { href: "/chat", label: "Chat" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white text-slate-700">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/ChatGPT%20Image%2015%20ene%202026,%2003_05_48%20p.m..png"
            alt="Adelia"
            className="h-[96px] w-[300px] object-contain"
          />
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-slate-900 ${
                pathname === item.href ? "text-slate-900" : "text-slate-700"
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
