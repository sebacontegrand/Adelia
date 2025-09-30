"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Newspaper } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/formats", label: "Formats" },
    { href: "/ad-builder", label: "Ad Builder" },
    { href: "/chat", label: "Chat" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Newspaper className="h-6 w-6" />
          <span className="text-xl font-bold">Adelia</span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Button variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
