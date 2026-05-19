const DEFAULT_SITE_URL = 'https://brzokucanje.rs'

function normalizeUrl(value: string | undefined | null): string | null {
  if (!value) return null
  const url = value.startsWith('http') ? value : `https://${value}`
  return url
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate)
    if (!normalized) continue
    if (/localhost|127\.0\.0\.1/i.test(normalized)) continue
    return normalized
  }

  return DEFAULT_SITE_URL
}

export function getRequestOrigin(request: Request): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}
