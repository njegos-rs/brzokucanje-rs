import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Admin — Newsletter' }
export default function AdminNewsletterPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Newsletter</h1>
      <p className="text-[var(--muted-foreground)]">Dolazi u v2.0.</p>
    </div>
  )
}
