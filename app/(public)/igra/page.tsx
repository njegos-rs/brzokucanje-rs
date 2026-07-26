import type { Metadata } from 'next'
import { IgraClient } from './IgraClient'

export const metadata: Metadata = {
  title: 'Igra | brzokucanje.rs',
  description: 'Svemirska igra za vežbanje brzog kucanja na srpskom jeziku.',
}

export default async function IgraPage() {
  return <IgraClient canPlay={true} />
}

