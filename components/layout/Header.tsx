'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogOut, User, Settings, Shield, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/vezbaj/latinica', label: 'Vežbaj' },
  { href: '/rank/latinica', label: 'Rang test' },
  { href: '/rang-lista/latinica', label: 'Rang lista' },
  { href: '/igra', label: 'Igra' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState<string | undefined>(undefined)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        supabase
          .from('profiles')
          .select('username, is_admin')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            const p = profile as { username: string; is_admin: boolean } | null
            setIsAdmin(p?.is_admin ?? false)
            setUsername(p?.username ?? data.user!.email?.split('@')[0])
          })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setIsAdmin(false); setUsername(undefined) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-base font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <Image src="/logo.svg" alt="brzokucanje.rs logo" width={28} height={28} aria-hidden="true" />
          <span>brzokucanje.rs</span>
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

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            aria-label={theme === 'light' ? 'Prebaci na tamnu temu' : 'Prebaci na svetlu temu'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <User className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <span>{username ?? user.email?.split('@')[0]}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
                    <Link
                      href="/profil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profil
                    </Link>
                    <Link
                      href="/podesavanja"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Podešavanja
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/pregled"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Admin
                      </Link>
                    )}
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Odjavi se
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/prijava"
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Prijava
              </Link>
              <Link
                href="/registracija"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 transition-opacity"
              >
                Registracija
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
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
                  'text-sm py-2 transition-colors hover:text-[var(--accent)]',
                  pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[var(--border)]" />
            {user ? (
              <>
                <Link
                  href="/profil"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm text-[var(--foreground)]"
                >
                  <User className="h-4 w-4" />
                  {username ?? user.email?.split('@')[0]}
                </Link>
                <Link
                  href="/podesavanja"
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm text-[var(--muted-foreground)]"
                >
                  Podešavanja
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/pregled"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm text-[var(--accent)]"
                  >
                    Admin panel
                  </Link>
                )}
                <button
                  onClick={() => { setMobileOpen(false); handleLogout() }}
                  className="py-2 text-left text-sm text-[var(--muted-foreground)]"
                >
                  Odjavi se
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/prijava"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Prijava
                </Link>
                <Link
                  href="/registracija"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm py-2 text-[var(--accent)] font-medium"
                >
                  Registracija
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
