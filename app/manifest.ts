import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brzokucanje.rs — Test brzine kucanja na srpskom',
    short_name: 'Brzokucanje',
    description:
      'Besplatni online test brzine kucanja na srpskom jeziku. Vežbaj ćirilicu i latinicu, prati napredak i takmiči se na rank listi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0f',
    theme_color: '#E8B84B',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
