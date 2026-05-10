import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { IgraClient } from './IgraClient'

export const metadata: Metadata = {
  title: 'Igra | brzokucanje.rs',
  description: 'Svemirska igra za vežbanje brzog kucanja na srpskom jeziku.',
}

export default async function IgraPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <IgraClient canPlay={!!user} />
}
