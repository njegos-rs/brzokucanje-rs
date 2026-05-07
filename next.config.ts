import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // typedRoutes: re-enable u Nedelji 2 kada budu sve rute kreirane
  experimental: {},
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
