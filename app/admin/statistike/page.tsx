import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Admin — Statistike' }
export default function AdminStatistikePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Statistike</h1>
      <p className="text-[var(--muted-foreground)]">Dolazi u Nedelji 5.</p>
    </div>
  )
}
