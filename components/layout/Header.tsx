'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Keyboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/vezbaj/latinica', label: 'Vežbaj' },
  { href: '/rang-lista/latinica', label: 'Rang lista' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-base font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <Keyboard className="h-5 w-5" aria-hidden="true" />
          <span>brzokucanje.rs</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigacija">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors hover:text-[var(--accent)]',
                pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/prijava"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Prijava
          </Link>
          <Link
            href="/registracija"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
          >
            Registracija
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Zatvori meni' : 'Otvori meni'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-4 py-4">
          <nav className="flex flex-col gap-3" aria-label="Mobilna navigacija">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm py-2 transition-colors hover:text-[var(--accent)]',
                  pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[var(--border)]" />
            <Link
              href="/prijava"
              onClick={() => setMobileOpen(false)}
              className="text-sm py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Prijava
            </Link>
            <Link
              href="/registracija"
              onClick={() => setMobileOpen(false)}
              className="text-sm py-2 text-[var(--accent)] font-medium"
            >
              Registracija
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
