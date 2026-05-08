import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TypewriterTitle } from '@/components/TypewriterTitle'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Hero */}
          <div className="mb-14 text-center">
            <TypewriterTitle />
            <p className="mt-4 text-lg text-[var(--muted-foreground)]">
              Testiraj brzinu kucanja na srpskom jeziku.
            </p>
          </div>

          {/* 2 glavne sekcije */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Vežbaj */}
            <Link
              href="/vezbaj/latinica"
              className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 transition-all hover:border-[var(--accent)]/70 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-2xl">
                  ⌨️
                </div>
                <span className="font-mono text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  Vežbaj
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Slobodna vežba bez pritiska. Bira se pismo, mod i težina. Kucaj koliko hoćeš.
              </p>
              <div className="mt-auto flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {['Latinica', 'Ћирилица', 'Latinica bez kvačica'].map((s) => (
                    <span key={s} className="rounded-md bg-[var(--muted)] px-2.5 py-1 text-xs font-mono text-[var(--muted-foreground)]">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Easy', 'Medium', 'Hard', 'Expert'].map((l) => (
                    <span key={l} className="rounded-md bg-[var(--muted)] px-2.5 py-1 text-xs font-mono text-[var(--muted-foreground)]">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </Link>

            {/* Rang test */}
            <Link
              href="/rank/latinica"
              className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 transition-all hover:border-[var(--accent)]/70 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-2xl">
                  🏆
                </div>
                <span className="font-mono text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  Rang test
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Dnevni tekst, jedan pokušaj — bori se za mesto na rang listi sa ostalim korisnicima.
              </p>
              <div className="mt-auto flex flex-col gap-2">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                  🔒 Prijava potrebna
                </span>
                <p className="text-xs text-[var(--muted-foreground)]/60">
                  Jedan pokušaj dnevno po pismu.
                </p>
              </div>
            </Link>
          </div>

          {/* Divider + Rang lista */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <Link
              href="/rang-lista/latinica"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors whitespace-nowrap"
            >
              Rang lista →
            </Link>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
