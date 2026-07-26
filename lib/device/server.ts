

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown'
export type DeviceConfidence = 'high' | 'medium' | 'low'

export interface DeviceContext {
  device_type: DeviceType
  device_confidence: DeviceConfidence
}

export function detectDevice(request: Request): DeviceContext {
  const clientHint = request.headers.get('sec-ch-ua-mobile')?.trim()
  const userAgent = request.headers.get('user-agent')?.toLowerCase() ?? ''
  const isTablet = /ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(userAgent)
  const isMobile = /mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)

  if (clientHint === '?1') {
    return { device_type: isTablet ? 'tablet' : 'mobile', device_confidence: 'high' }
  }

  if (clientHint === '?0') {
    return { device_type: 'desktop', device_confidence: 'medium' }
  }

  if (isTablet) return { device_type: 'tablet', device_confidence: 'medium' }
  if (isMobile) return { device_type: 'mobile', device_confidence: 'medium' }
  if (userAgent) return { device_type: 'desktop', device_confidence: 'low' }
  return { device_type: 'unknown', device_confidence: 'low' }
}