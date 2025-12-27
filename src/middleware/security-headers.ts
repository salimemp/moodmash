/**
 * Security Headers Middleware (v1.0)
 * 
 * Comprehensive security headers implementation following OWASP best practices:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing protection)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Cross-Origin policies (CORS, COEP, COOP, CORP)
 * - Subresource Integrity (SRI) support
 */

import type { Context, Next } from 'hono'
import type { Bindings } from '../types'

interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | ContentSecurityPolicyConfig
  strictTransportSecurity?: string | HSTSConfig
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string
  contentTypeOptions?: boolean
  xssProtection?: boolean | string
  referrerPolicy?: string
  permissionsPolicy?: string | PermissionsPolicyConfig
  crossOriginEmbedderPolicy?: 'unsafe-none' | 'require-corp' | 'credentialless'
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none'
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin'
  reportOnly?: boolean
}

interface ContentSecurityPolicyConfig {
  'default-src'?: string[]
  'script-src'?: string[]
  'style-src'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'media-src'?: string[]
  'object-src'?: string[]
  'frame-src'?: string[]
  'worker-src'?: string[]
  'form-action'?: string[]
  'base-uri'?: string[]
  'manifest-src'?: string[]
  'frame-ancestors'?: string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
  'report-uri'?: string
  'report-to'?: string
}

interface HSTSConfig {
  maxAge: number
  includeSubDomains?: boolean
  preload?: boolean
}

interface PermissionsPolicyConfig {
  geolocation?: string
  microphone?: string
  camera?: string
  payment?: string
  usb?: string
  magnetometer?: string
  gyroscope?: string
  accelerometer?: string
  fullscreen?: string
  'picture-in-picture'?: string
}

/**
 * Default security headers configuration
 */
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for CDN scripts
      'https://cdn.tailwindcss.com',
      'https://cdn.jsdelivr.net',
      'https://challenges.cloudflare.com',
      'https://www.gstatic.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      'https://cdn.tailwindcss.com',
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://cdn.jsdelivr.net',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.cloudflare.com',
      'https://*.sentry.io',
      'https://*.grafana.net',
      'https://generativelanguage.googleapis.com',
    ],
    'media-src': ["'self'", 'blob:', 'data:'],
    'object-src': ["'none'"],
    'frame-src': [
      "'self'",
      'https://challenges.cloudflare.com',
    ],
    'worker-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
  },

  // HTTP Strict Transport Security (2 years)
  strictTransportSecurity: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameOptions: 'DENY',

  // X-Content-Type-Options
  contentTypeOptions: true,

  // X-XSS-Protection (legacy, but still useful)
  xssProtection: '1; mode=block',

  // Referrer-Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions-Policy
  permissionsPolicy: {
    geolocation: 'self',
    microphone: 'self',
    camera: 'self',
    payment: 'self',
    usb: '()',
    magnetometer: '()',
    gyroscope: 'self',
    accelerometer: 'self',
    fullscreen: 'self',
    'picture-in-picture': 'self',
  },

  // Cross-Origin Policies
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',

  // Report-only mode for testing
  reportOnly: false,
}

/**
 * Build Content-Security-Policy header value
 */
function buildCSPHeader(config: ContentSecurityPolicyConfig): string {
  const directives: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (key === 'upgrade-insecure-requests' && value) {
      directives.push('upgrade-insecure-requests')
    } else if (key === 'block-all-mixed-content' && value) {
      directives.push('block-all-mixed-content')
    } else if (Array.isArray(value)) {
      directives.push(`${key} ${value.join(' ')}`)
    } else if (typeof value === 'string') {
      directives.push(`${key} ${value}`)
    }
  }

  return directives.join('; ')
}

/**
 * Build HSTS header value
 */
function buildHSTSHeader(config: HSTSConfig): string {
  let header = `max-age=${config.maxAge}`
  if (config.includeSubDomains) {
    header += '; includeSubDomains'
  }
  if (config.preload) {
    header += '; preload'
  }
  return header
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicyHeader(config: PermissionsPolicyConfig): string {
  const directives: string[] = []

  for (const [key, value] of Object.entries(config)) {
    directives.push(`${key}=${value}`)
  }

  return directives.join(', ')
}

/**
 * Security Headers Middleware
 */
export function securityHeaders(customConfig?: Partial<SecurityHeadersConfig>) {
  const config = { ...DEFAULT_CONFIG, ...customConfig }

  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    await next()

    // Content-Security-Policy
    if (config.contentSecurityPolicy) {
      const cspValue = typeof config.contentSecurityPolicy === 'string'
        ? config.contentSecurityPolicy
        : buildCSPHeader(config.contentSecurityPolicy)
      
      const cspHeader = config.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'
      
      c.header(cspHeader, cspValue)
    }

    // Strict-Transport-Security (HSTS)
    if (config.strictTransportSecurity) {
      const hstsValue = typeof config.strictTransportSecurity === 'string'
        ? config.strictTransportSecurity
        : buildHSTSHeader(config.strictTransportSecurity)
      
      c.header('Strict-Transport-Security', hstsValue)
    }

    // X-Frame-Options
    if (config.frameOptions) {
      c.header('X-Frame-Options', config.frameOptions)
    }

    // X-Content-Type-Options
    if (config.contentTypeOptions) {
      c.header('X-Content-Type-Options', 'nosniff')
    }

    // X-XSS-Protection
    if (config.xssProtection) {
      const xssValue = typeof config.xssProtection === 'string'
        ? config.xssProtection
        : '1; mode=block'
      c.header('X-XSS-Protection', xssValue)
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      c.header('Referrer-Policy', config.referrerPolicy)
    }

    // Permissions-Policy
    if (config.permissionsPolicy) {
      const ppValue = typeof config.permissionsPolicy === 'string'
        ? config.permissionsPolicy
        : buildPermissionsPolicyHeader(config.permissionsPolicy)
      
      c.header('Permissions-Policy', ppValue)
    }

    // Cross-Origin-Embedder-Policy
    if (config.crossOriginEmbedderPolicy) {
      c.header('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
    }

    // Cross-Origin-Opener-Policy
    if (config.crossOriginOpenerPolicy) {
      c.header('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
    }

    // Cross-Origin-Resource-Policy
    if (config.crossOriginResourcePolicy) {
      c.header('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
    }

    // Additional security headers
    c.header('X-DNS-Prefetch-Control', 'off')
    c.header('X-Download-Options', 'noopen')
    c.header('X-Permitted-Cross-Domain-Policies', 'none')
  }
}

/**
 * Relaxed security headers for development
 */
export function developmentSecurityHeaders() {
  return securityHeaders({
    contentSecurityPolicy: {
      'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https:', 'wss:', 'ws:'],
      'media-src': ["'self'", 'blob:', 'data:', 'https:'],
      'object-src': ["'none'"],
      'frame-src': ["'self'", 'https:'],
      'worker-src': ["'self'", 'blob:'],
    },
    crossOriginEmbedderPolicy: 'unsafe-none',
    crossOriginOpenerPolicy: 'unsafe-none',
    crossOriginResourcePolicy: 'cross-origin',
    reportOnly: true,
  })
}

/**
 * Strict security headers for production
 */
export function productionSecurityHeaders() {
  return securityHeaders({
    ...DEFAULT_CONFIG,
    reportOnly: false,
  })
}

/**
 * API-specific security headers (more relaxed for CORS)
 */
export function apiSecurityHeaders() {
  return securityHeaders({
    contentSecurityPolicy: {
      'default-src': ["'none'"],
      'script-src': ["'none'"],
      'style-src': ["'none'"],
      'img-src': ["'none'"],
      'font-src': ["'none'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
    },
    frameOptions: 'DENY',
    crossOriginResourcePolicy: 'cross-origin',
  })
}

/**
 * Generate nonce for inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * CSP with nonce support
 */
export function cspWithNonce(nonce: string) {
  return securityHeaders({
    contentSecurityPolicy: {
      ...DEFAULT_CONFIG.contentSecurityPolicy as ContentSecurityPolicyConfig,
      'script-src': [
        "'self'",
        `'nonce-${nonce}'`,
        'https://cdn.tailwindcss.com',
        'https://cdn.jsdelivr.net',
        'https://challenges.cloudflare.com',
      ],
    },
  })
}

/**
 * Report CSP violations
 */
export async function handleCSPReport(c: Context<{ Bindings: Bindings }>) {
  try {
    const report = await c.req.json()
    console.error('[CSP Violation Report]:', JSON.stringify(report, null, 2))

    // Log to monitoring service
    if (c.env.SENTRY_DSN) {
      // Send to Sentry
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('[CSP Report] Error:', error)
    return c.json({ error: 'Failed to process report' }, 400)
  }
}

export {
  SecurityHeadersConfig,
  ContentSecurityPolicyConfig,
  HSTSConfig,
  PermissionsPolicyConfig,
  DEFAULT_CONFIG,
}
