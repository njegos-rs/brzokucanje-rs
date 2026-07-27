import type { Metadata } from 'next'
import { PrijavaForma } from '@/components/auth/PrijavaForma'

export const metadata: Metadata = {
  title: 'Prijava',
  description: 'Prijavi se na Brzokucanje.rs nalog za praćenje napretka i takmičenje na rank listi.',
  robots: { index: false, follow: true },
}

export default function PrijavaPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <PrijavaForma />
      </div>
    </div>
  )
}
