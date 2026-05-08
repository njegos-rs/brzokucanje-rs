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

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://brzokucanje.rs'

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
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: appUrl,
    languages: {
      'sr-Latn': `${appUrl}/vezbaj/latinica`,
      'sr-Cyrl': `${appUrl}/vezbaj/cirilica`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: 'Brzokucanje.rs',
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brzokucanje.rs — Test brzine kucanja na srpskom',
    description: 'Besplatni online test brzine kucanja na srpskom jeziku.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Brzokucanje.rs',
    url: appUrl,
    description: 'Besplatni online test brzine kucanja na srpskom jeziku.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: ['sr-Latn', 'sr-Cyrl'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RSD' },
  }

  return (
    <html lang="sr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
