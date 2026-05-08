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

function PrijavaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

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
