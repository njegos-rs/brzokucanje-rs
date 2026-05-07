import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            <span className="text-[var(--accent)]">brzokucanje</span>.rs
          </h1>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Test brzine kucanja na srpskom jeziku — ćirilica, latinica i easy mod.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/vezbaj/latinica"
              className="rounded-md bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
            >
              Počni vežbu
            </Link>
            <Link
              href="/rang-lista/latinica"
              className="rounded-md border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Rang lista
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
