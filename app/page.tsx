import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TypewriterTitle } from '@/components/TypewriterTitle'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl">

          {/* Hero */}
          <div className="mb-14 text-center">
            <TypewriterTitle />
            <p className="mt-4 text-lg text-[var(--muted-foreground)]">
              Testiraj brzinu kucanja na srpskom jeziku.
            </p>
          </div>

          {/* 3 kartice */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

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

            {/* Rank test */}
            <Link
              href="/rank/latinica"
              className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 transition-all hover:border-[var(--accent)]/70 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-2xl">
                  🏆
                </div>
                <span className="font-mono text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  Rank test
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Dnevni tekst, jedan pokušaj — bori se za mesto na rank listi sa ostalim korisnicima.
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

            {/* Igra */}
            <Link
              href={user ? '/igra' : '/registracija'}
              className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 transition-all hover:border-[var(--accent)]/70 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-2xl">
                  🚀
                </div>
                <span className="font-mono text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  Igra
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Svemirska igra kucanja — uništi reči koje padaju pre nego što dostignu brod.
              </p>

              {/* Mini preview igre */}
              <div className="relative mt-1 h-24 overflow-hidden rounded-lg border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)]">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(128,128,128,0.3)_1px,transparent_1px)] [background-size:24px_24px]" />
                {/* Reči u preview */}
                {[
                  { word: 'brzina', x: '22%', y: '18%' },
                  { word: 'ritam',  x: '58%', y: '32%' },
                  { word: 'fokus',  x: '38%', y: '55%' },
                ].map(({ word, x, y }) => (
                  <div
                    key={word}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{ left: x, top: y }}
                  >
                    <div className="mx-auto mb-0.5 h-2 w-2 rotate-45 rounded-[2px] border border-[var(--muted-foreground)]/40 bg-[var(--muted)]" />
                    <div className="rounded border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground)]">
                      {word}
                    </div>
                  </div>
                ))}
                {/* Brod */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <div className="relative h-6 w-7">
                    <div className="absolute left-1/2 top-0 h-5 w-2.5 -translate-x-1/2 rounded-t-full border border-[var(--accent)] bg-[var(--background)]" />
                    <div className="absolute bottom-0.5 left-0 h-1.5 w-7 rounded-full bg-[var(--muted)]" />
                    <div className="absolute bottom-0 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-b-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                {user ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                    ▶ Igraj odmah
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                    🔒 Registracija potrebna
                  </span>
                )}
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
              Rank lista →
            </Link>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
