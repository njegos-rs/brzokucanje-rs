import type { Metadata } from 'next'
import { IgraClient } from './IgraClient'

export const metadata: Metadata = {
  title: 'Svemirska igra kucanja',
  description: 'Svemirska igra za vežbanje brzog kucanja na srpskom jeziku.',
  alternates: {
    canonical: 'https://www.brzokucanje.rs/igra',
  },
  openGraph: {
    title: 'Igra — Svemirska igra kucanja | brzokucanje.rs',
    description: 'Uništi reči koje padaju pre nego što dostignu brod. Igraj odmah!',
    url: 'https://www.brzokucanje.rs/igra',
  },
}

export default async function IgraPage() {
  return <IgraClient canPlay={true} />
}

