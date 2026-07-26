'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validators/auth'
import { cn } from '@/lib/utils'

interface Props {
  redirectTo?: string
}

export function PrijavaForma({ redirectTo = '/admin/pregled' }: Props) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onLogin = async (data: LoginInput) => {
    setServerError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      const json = await res.json().catch(() => ({ error: 'Neuspešna mrežna veza.' }))

      if (!res.ok || json.error) {
        setServerError(json.error || 'Pogrešan email ili lozinka.')
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setServerError('Mrežna greška. Pokušajte ponovo.')
    }
  }

  return (
    <div className="w-full">
      <h2 className="mb-1 text-2xl font-bold text-[var(--foreground)]">Admin Prijava</h2>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Ova stranica je samo za administratore.
      </p>

      <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Email</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="admin@brzokucanje.rs"
            className={cn(
              'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]',
              'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
              errors.email ? 'border-[var(--incorrect)]' : 'border-[var(--border)]',
            )}
          />
          {errors.email && <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Lozinka</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Vaša lozinka"
              className={cn(
                'w-full rounded-md border bg-[var(--card)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]',
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
          {errors.password && <p className="mt-1 text-xs text-[var(--incorrect)]">{errors.password.message}</p>}
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
  )
}

