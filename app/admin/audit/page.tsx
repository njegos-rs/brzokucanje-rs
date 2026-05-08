import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Admin — Audit log' }
export default function AdminAuditPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Audit log</h1>
      <p className="text-[var(--muted-foreground)]">Dolazi u Nedelji 4.</p>
    </div>
  )
}
