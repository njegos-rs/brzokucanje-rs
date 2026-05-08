'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldAlert,
  BarChart3,
  MessageSquareWarning,
  Mail,
  ClipboardList,
  Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin/pregled', label: 'Pregled', icon: LayoutDashboard },
  { href: '/admin/korisnici', label: 'Korisnici', icon: Users },
  { href: '/admin/sadrzaj', label: 'Sadržaj', icon: FileText },
  { href: '/admin/anti-cheat', label: 'Anti-cheat', icon: ShieldAlert },
  { href: '/admin/statistike', label: 'Statistike', icon: BarChart3 },
  { href: '/admin/profanity', label: 'Profanity', icon: MessageSquareWarning },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/audit', label: 'Audit log', icon: ClipboardList },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:flex flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4">
        <Keyboard className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-mono text-sm font-semibold text-[var(--accent)]">Admin</span>
      </div>
      <nav className="flex-1 py-4">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <Link
          href="/"
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Nazad na sajt
        </Link>
      </div>
    </aside>
  )
}
