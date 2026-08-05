const DEFAULT_SITE_URL = 'https://www.brzokucanje.rs'

export function getSiteUrl(): string {
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
