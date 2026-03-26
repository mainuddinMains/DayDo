/**
 * Google OAuth 2.0 + PKCE utilities.
 *
 * Uses the Authorization Code flow with PKCE (RFC 7636) so that no
 * client_secret is required in browser code.
 *
 * Setup in Google Cloud Console:
 *   1. APIs & Services → Credentials → Create OAuth 2.0 Client ID
 *   2. Application type: "Web application"
 *   3. Authorised redirect URIs: add VITE_GOOGLE_REDIRECT_URI
 *   4. Enable the "Tasks API" in APIs & Services → Library
 *
 * Required env vars (see .env.example):
 *   VITE_GOOGLE_CLIENT_ID
 *   VITE_GOOGLE_REDIRECT_URI
 *
 * NOTE: Google still requires client_secret for web-app token exchange
 * even with PKCE. For production, proxy the token exchange through your
 * own backend endpoint to keep the secret off the client.
 * See: https://developers.google.com/identity/protocols/oauth2/web-server
 */

const STORAGE_KEY = 'daydo_google_tokens'
const VERIFIER_KEY = 'daydo_pkce_verifier'

export const SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
].join(' ')

/* ── Token shape ───────────────────────────────────────────────────────────── */

export interface GoogleTokens {
  access_token:   string
  refresh_token?: string
  expires_at:     number   // Unix ms
  token_type:     string
  scope:          string
}

/* ── PKCE helpers ──────────────────────────────────────────────────────────── */

function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes.buffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return base64UrlEncode(digest)
}

/* ── Auth URL ──────────────────────────────────────────────────────────────── */

export function buildAuthUrl(params: {
  clientId:      string
  redirectUri:   string
  codeChallenge: string
  state?:        string
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',             params.clientId)
  url.searchParams.set('redirect_uri',          params.redirectUri)
  url.searchParams.set('response_type',         'code')
  url.searchParams.set('scope',                 SCOPES)
  url.searchParams.set('access_type',           'offline')
  url.searchParams.set('prompt',                'consent')
  url.searchParams.set('code_challenge',        params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  if (params.state) url.searchParams.set('state', params.state)
  return url.toString()
}

/* ── Token exchange ────────────────────────────────────────────────────────── */

export async function exchangeCode(params: {
  code:          string
  codeVerifier:  string
  clientId:      string
  clientSecret?: string   // proxy through backend in production
  redirectUri:   string
}): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code:          params.code,
    client_id:     params.clientId,
    redirect_uri:  params.redirectUri,
    grant_type:    'authorization_code',
    code_verifier: params.codeVerifier,
  })
  if (params.clientSecret) body.set('client_secret', params.clientSecret)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(err.error_description ?? `Token exchange failed (${res.status})`)
  }
  const data = await res.json() as {
    access_token:  string
    refresh_token?: string
    expires_in:    number
    token_type:    string
    scope:         string
  }
  return {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + data.expires_in * 1000,
    token_type:    data.token_type,
    scope:         data.scope,
  }
}

/* ── Token refresh ─────────────────────────────────────────────────────────── */

export async function refreshAccessToken(params: {
  refreshToken:  string
  clientId:      string
  clientSecret?: string
}): Promise<Pick<GoogleTokens, 'access_token' | 'expires_at' | 'token_type' | 'scope'>> {
  const body = new URLSearchParams({
    refresh_token: params.refreshToken,
    client_id:     params.clientId,
    grant_type:    'refresh_token',
  })
  if (params.clientSecret) body.set('client_secret', params.clientSecret)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Token refresh failed (${res.status})`)

  const data = await res.json() as {
    access_token: string
    expires_in:   number
    token_type:   string
    scope:        string
  }
  return {
    access_token: data.access_token,
    expires_at:   Date.now() + data.expires_in * 1000,
    token_type:   data.token_type,
    scope:        data.scope,
  }
}

/* ── Token storage ─────────────────────────────────────────────────────────── */

export function saveTokens(tokens: GoogleTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function loadTokens(): GoogleTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GoogleTokens) : null
  } catch {
    return null
  }
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
}

export function saveVerifier(v: string): void {
  sessionStorage.setItem(VERIFIER_KEY, v)
}

export function loadVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_KEY)
}

/** True if the token expires within 60 seconds */
export function isExpired(tokens: GoogleTokens): boolean {
  return Date.now() >= tokens.expires_at - 60_000
}
