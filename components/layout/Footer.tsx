import Link from 'next/link'
import { Keyboard } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)]">
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
              <p className="text-xs font-medium text-[var(--foreground)]">Rang lista</p>
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
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--foreground)]">Ostalo</p>
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
