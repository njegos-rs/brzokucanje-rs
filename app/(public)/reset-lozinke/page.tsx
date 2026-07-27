import type { Metadata } from 'next'
import { ResetLozinkeForm } from './ResetLozinkeForm'

export const metadata: Metadata = {
  title: 'Promena lozinke',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetLozinkePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <ResetLozinkeForm />
    </div>
  )
}
