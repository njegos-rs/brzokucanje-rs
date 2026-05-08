'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, forgotPasswordSchema, type LoginInput, type ForgotPasswordInput } from '@/lib/validators/auth'
import { cn } from '@/lib/utils'

const OAUTH_PROVIDERS = [
  {
    id: 'google' as const,
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: 'facebook' as const,
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'apple' as const,
    label: 'Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    id: 'twitter' as const,
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

function Divider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-xs text-[var(--muted-foreground)]">ili</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleOAuth = async (provider: 'google' | 'facebook' | 'apple' | 'twitter') => {
    setLoadingProvider(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoadingProvider(null)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {OAUTH_PROVIDERS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuth(id)}
          disabled={loadingProvider !== null}
          className={cn(
            'flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]',
            'hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {loadingProvider === id ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

function PrijavaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const callbackError = searchParams.get('error')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: forgotSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onLogin = async (data: LoginInput) => {
    setServerError(null)
    const supabase = createClient()

    if (!rememberMe) {
      // Kratka sesija — briše se kad se browser zatvori
      await supabase.auth.setSession({ access_token: '', refresh_token: '' }).catch(() => {})
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setServerError('Pogrešan email ili lozinka.')
      } else if (error.message.includes('Email not confirmed')) {
        setServerError('Email nije verifikovan. Proveri inbox i klikni na link za verifikaciju.')
      } else {
        setServerError(error.message)
      }
      return
    }

    if (!rememberMe) {
      // Označi da se sesija ne čuva između otvaranja browsera
      try { sessionStorage.setItem('supabase_no_persist', '1') } catch { /* ignore */ }
    }

    router.push('/')
    router.refresh()
  }

  const onForgotPassword = async (data: ForgotPasswordInput) => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-lozinke`,
    })
    setForgotSent(true)
  }

  if (forgotMode) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Reset lozinke</h1>
          <p className="mb-8 text-sm text-[var(--muted-foreground)]">
            Unesite email i poslaćemo vam link za reset.
          </p>

          {forgotSent ? (
            <div className="rounded-md border border-[var(--correct)]/30 bg-[var(--correct)]/10 p-4 text-center">
              <Check className="mx-auto mb-2 h-5 w-5 text-[var(--correct)]" />
              <p className="text-sm text-[var(--foreground)]">Link je poslat na vaš email.</p>
              <button
                onClick={() => { setForgotMode(false); setForgotSent(false) }}
                className="mt-3 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                ← Nazad na prijavu
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit(onForgotPassword)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Email</label>
                <input
                  {...registerForgot('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="janko@primer.rs"
                  className={cn(
                    'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors',
                    'placeholder:text-[var(--muted-foreground)]',
                    'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                    forgotErrors.email ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                  )}
                />
                {forgotErrors.email && (
                  <p className="mt-1 text-xs text-[var(--incorrect)]">{forgotErrors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {forgotSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Pošalji link
              </button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Nazad
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Prijava</h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Nemaš nalog?{' '}
          <Link href="/registracija" className="text-[var(--accent)] hover:opacity-80 transition-opacity">
            Registruj se
          </Link>
        </p>

        {callbackError && (
          <div className="mb-4 rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
            <p className="text-sm text-[var(--incorrect)]">Verifikacija nije uspela. Pokušaj ponovo.</p>
          </div>
        )}

        <OAuthButtons />

        <Divider />

        <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="janko@primer.rs"
              className={cn(
                'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                errors.email ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--foreground)]">Lozinka</label>
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Zaboravili ste lozinku?
              </button>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Vaša lozinka"
                className={cn(
                  'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
                  errors.password ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.password.message}</p>
            )}
          </div>

          {/* Zapamti me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={cn(
                'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                rememberMe
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'bg-[var(--card)] border-[var(--border)]',
              )}
            >
              {rememberMe && <Check className="h-2.5 w-2.5 text-[var(--accent-foreground)]" />}
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">Zapamti me</span>
          </label>

          {serverError && (
            <div className="rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
              <p className="text-sm text-[var(--incorrect)]">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Prijavi se
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PrijavaPage() {
  return (
    <Suspense>
      <PrijavaContent />
    </Suspense>
  )
}
