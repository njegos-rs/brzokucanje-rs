import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Brzokucanje.rs — Test brzine kucanja na srpskom',
    template: '%s | Brzokucanje.rs',
  },
  description:
    'Besplatni online test brzine kucanja na srpskom jeziku. Vežbaj ćirilicu i latinicu, prati napredak i takmič se na rang listi.',
  keywords: [
    'brzo kucanje',
    'test brzine kucanja',
    'slepo kucanje',
    'typing test srpski',
    'test kucanja online',
    'vežba kucanja',
    'rang lista kucanja',
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://brzokucanje.rs',
  ),
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: 'Brzokucanje.rs',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  )
}
