'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PrijavaForma } from '@/components/auth/PrijavaForma'

function PrijavaContent() {
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const errorMessage = errorDescription
    ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
    : callbackError
      ? 'Prijava nije uspela. Pokušaj ponovo.'
      : null

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {errorMessage && (
          <div className="mb-4 rounded-md border border-[var(--incorrect)]/30 bg-[var(--incorrect)]/10 px-3 py-2.5">
            <p className="text-sm text-[var(--incorrect)]">{errorMessage}</p>
          </div>
        )}
        <PrijavaForma />
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
