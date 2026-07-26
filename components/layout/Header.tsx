'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, User, Settings, Shield, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { ensureAnonymousSession } from '@/lib/auth/anonymous'
import { NicknameModal } from '@/components/auth/NicknameModal'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'

const NAV_LINKS = [
  { href: '/vezbaj/latinica', label: 'Vežbaj' },
  { href: '/rank/latinica', label: 'Rank test' },
  { href: '/rang-lista/latinica', label: 'Rank lista' },
  { href: '/igra', label: 'Igra' },
]

export function Header() {
  const pathname = usePathname()
  const { theme, toggle: toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [showNicknameModal, setShowNicknameModal] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    // Proveri odmah localStorage
    if (typeof window !== 'undefined') {
      const localNick = localStorage.getItem('brzokucanje_nickname')
      if (localNick) setUsername(localNick)
    }

    const supabase = createClient()

    const init = async () => {
      try {
        // Osiguraj da anonimna sesija postoji (ako je Supabase dostupan)
        await ensureAnonymousSession()

        const { data } = await supabase.auth.getUser()

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, is_admin')
            .eq('id', data.user.id)
            .maybeSingle()

          const p = profile as { username: string | null; is_admin: boolean } | null
          setIsAdmin(p?.is_admin ?? false)
          if (p?.username) {
            setUsername(p.username)
            if (typeof window !== 'undefined') {
              localStorage.setItem('brzokucanje_nickname', p.username)
            }
          }
        }
      } catch (err) {
        console.warn('[Header] Session init suppressed error:', err)
      } finally {
        setProfileLoaded(true)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setIsAdmin(false); setUsername(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header data-site-header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      {showNicknameModal && (
        <NicknameModal
          onNicknameSet={(newNick) => {
            setUsername(newNick)
            setShowNicknameModal(false)
            if (typeof window !== 'undefined') {
              localStorage.setItem('brzokucanje_nickname', newNick)
            }
          }}
        />
      )}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-base font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <Image src="/logo.svg" alt="brzokucanje.rs logo" width={28} height={28} aria-hidden="true" />
          <span className="hidden sm:inline">brzokucanje.rs</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigacija">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors hover:text-[var(--accent)]',
                pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop user area */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            aria-label={theme === 'light' ? 'Prebaci na tamnu temu' : 'Prebaci na svetlu temu'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {!profileLoaded ? (
            <div className="h-8 w-24 rounded-md bg-[var(--muted)] animate-pulse" aria-hidden="true" />
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/podesavanja"
                className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                aria-label="Podešavanja"
              >
                <Settings className="h-4 w-4" />
              </Link>
              {username ? (
                <Link
                  href="/profil"
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>{username}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowNicknameModal(true)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-[var(--accent)]/60 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Postavi ime</span>
                </button>
              )}
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/admin/pregled"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                  <AdminLogoutButton className="w-auto" buttonClassName="w-auto inline-flex px-2 py-1 text-xs" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden min-h-11 min-w-11 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Zatvori meni' : 'Otvori meni'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-4 py-4">
          <nav className="flex flex-col gap-3" aria-label="Mobilna navigacija">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'min-h-11 flex items-center text-sm transition-colors hover:text-[var(--accent)]',
                  pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[var(--border)]" />
            {username && (
              <Link
                href="/profil"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 text-sm text-[var(--foreground)]"
              >
                <User className="h-4 w-4" />
                {username}
              </Link>
            )}
            <Link
              href="/podesavanja"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm text-[var(--muted-foreground)]"
            >
              Podešavanja
            </Link>
            {isAdmin && (
              <div className="space-y-1">
                <Link
                  href="/admin/pregled"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-[var(--accent)]"
                >
                  Admin panel
                </Link>
                <AdminLogoutButton onLoggedOut={() => setMobileOpen(false)} />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}




