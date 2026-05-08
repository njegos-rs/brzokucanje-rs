import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Admin — Profanity' }
export default function AdminProfanityPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Profanity</h1>
      <p className="text-[var(--muted-foreground)]">Dolazi u Nedelji 5.</p>
    </div>
  )
}
