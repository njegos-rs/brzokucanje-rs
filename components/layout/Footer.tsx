'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Keyboard } from 'lucide-react'

export function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()

  if (pathname.startsWith('/rank/') || pathname.startsWith('/vezbaj/') || pathname === '/igra') return null

  return (
    <footer className="mt-auto hidden border-t border-[var(--border)] bg-[var(--background)] sm:block">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-sm font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              <Keyboard className="h-4 w-4" aria-hidden="true" />
              <span>brzokucanje.rs</span>
            </Link>
            <p className="text-xs text-[var(--muted-foreground)] max-w-[220px]">
              Besplatni test brzine kucanja na srpskom jeziku — ćirilica i latinica.
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-8" aria-label="Footer navigacija">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--foreground)]">Vežbaj</p>
              <Link
                href="/vezbaj/latinica"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Latinica
              </Link>
              <Link
                href="/vezbaj/cirilica"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Ćirilica
              </Link>
              <Link
                href="/vezbaj/easy"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Easy (bez kvačica)
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--foreground)]">Rank lista</p>
              <Link
                href="/rang-lista/latinica"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Latinica
              </Link>
              <Link
                href="/rang-lista/cirilica"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Ćirilica
              </Link>
              <Link
                href="/rang-lista/easy"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Easy (bez kvačica)
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--foreground)]">Ostalo</p>
              <Link
                href="/kako-kucati-brzo"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Kako kucati brzo
              </Link>
              <Link
                href="/o-nama"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                O nama
              </Link>
              <Link
                href="/politika-privatnosti"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Politika privatnosti
              </Link>
              <Link
                href="/uslovi-koriscenja"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Uslovi korišćenja
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {year} Brzokucanje.rs — Sva prava zadržana
          </p>
        </div>
      </div>
    </footer>
  )
}
