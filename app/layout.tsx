import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import { CookieConsent } from '@/components/CookieConsent'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getSiteUrl } from '@/lib/site'
import './globals.css'

const appUrl = getSiteUrl()

export const metadata: Metadata = {
  title: {
    default: 'Brzokucanje.rs — Test brzine kucanja na srpskom',
    template: '%s | Brzokucanje.rs',
  },
  description:
    'Besplatni online test brzine kucanja na srpskom jeziku. Vežbaj ćirilicu i latinicu, prati napredak i takmič se na rank listi.',
  keywords: [
    'brzo kucanje',
    'test brzine kucanja',
    'slepo kucanje',
    'typing test srpski',
    'test kucanja online',
    'vežba kucanja',
    'rank lista kucanja',
  ],
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: appUrl,
    languages: {
      'sr-Latn': `${appUrl}/vezbaj/latinica`,
      'sr-Cyrl': `${appUrl}/vezbaj/cirilica`,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    siteName: 'Brzokucanje.rs',
    url: appUrl,
    images: [
      { url: '/og-image.svg', width: 1200, height: 630, alt: 'brzokucanje.rs' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brzokucanje.rs — Test brzine kucanja na srpskom',
    description: 'Besplatni online test brzine kucanja na srpskom jeziku.',
    images: ['/og-image.svg'],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
        {children}
        {/* Plausible Analytics — tracks only on brzokucanje.rs (no-op on localhost) */}
        <Script
          defer
          data-domain="brzokucanje.rs"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        {/* TODO: Add GA4 gtag once a Measurement ID is obtained from the client */}
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
        <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
