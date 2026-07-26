import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { TypewriterTitle } from '@/components/TypewriterTitle'

export default function HomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden sm:h-[100dvh] sm:overflow-hidden">
      <Header />
      <main className="min-h-0 flex flex-1 flex-col items-center justify-start px-4 py-4 sm:overflow-hidden sm:px-6 sm:py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-4 text-center sm:mb-10">
            <TypewriterTitle />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            <Link
              href="/vezbaj/latinica"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.04)] transition-all hover:border-[var(--accent)]/70 hover:shadow-lg sm:gap-4 sm:p-7 sm:hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">
                  ⌨️
                </div>
                <span className="font-mono text-lg font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] sm:text-xl">
                  Vežbaj
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)] sm:line-clamp-none sm:text-sm">
                Slobodna vežba bez pritiska. Bira se pismo, mod i težina. Kucaj koliko hoćeš.
              </p>
              <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {['Latinica', 'Ћирилица', 'Latinica bez kvačica'].map((s) => (
                    <span key={s} className="rounded-md bg-[var(--muted)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)] sm:px-2.5 sm:py-1 sm:text-xs">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Easy', 'Medium', 'Hard', 'Expert'].map((l) => (
                    <span key={l} className="rounded-md bg-[var(--muted)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)] sm:px-2.5 sm:py-1 sm:text-xs">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </Link>

            <Link
              href="/rank/latinica"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.04)] transition-all hover:border-[var(--accent)]/70 hover:shadow-lg sm:gap-4 sm:p-7 sm:hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">
                  🏆
                </div>
                <span className="font-mono text-lg font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] sm:text-xl">
                  Rank test
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)] sm:line-clamp-none sm:text-sm">
                Dnevni tekst, jedan pokušaj — bori se za mesto na rank listi sa ostalim korisnicima.
              </p>
              <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                  ▶ Igraj odmah
                </span>
                <p className="hidden text-xs text-[var(--muted-foreground)]/60 sm:block">
                  Jedan pokušaj dnevno po pismu.
                </p>
              </div>
            </Link>

            <Link
              href="/igra"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.04)] transition-all hover:border-[var(--accent)]/70 hover:shadow-lg sm:gap-4 sm:p-7 sm:hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">
                  🚀
                </div>
                <span className="font-mono text-lg font-bold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] sm:text-xl">
                  Igra
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)] sm:line-clamp-none sm:text-sm">
                Svemirska igra kucanja — uništi reči koje padaju pre nego što dostignu brod.
              </p>

              <div className="relative mt-1 h-16 overflow-hidden rounded-lg border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)] sm:h-24">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(128,128,128,0.3)_1px,transparent_1px)] [background-size:24px_24px]" />
                {[
                  { word: 'brzina', x: '22%', y: '18%' },
                  { word: 'ritam', x: '58%', y: '32%' },
                  { word: 'fokus', x: '38%', y: '55%' },
                ].map(({ word, x, y }) => (
                  <div key={word} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: x, top: y }}>
                    <div className="mx-auto mb-0.5 h-2 w-2 rotate-45 rounded-[2px] border border-[var(--muted-foreground)]/40 bg-[var(--muted)]" />
                    <div className="rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground)]">
                      {word}
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <div className="relative h-6 w-7">
                    <div className="absolute left-1/2 top-0 h-5 w-2.5 -translate-x-1/2 rounded-t-full border border-[var(--accent)] bg-[var(--background)]" />
                    <div className="absolute bottom-0.5 left-0 h-1.5 w-7 rounded-full bg-[var(--muted)]" />
                    <div className="absolute bottom-0 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-b-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                  ▶ Igraj odmah
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
