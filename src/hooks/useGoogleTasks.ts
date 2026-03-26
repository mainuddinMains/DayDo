/**
 * useGoogleTasks — orchestrates Google OAuth2 PKCE flow + task sync.
 *
 * Call this hook once at the AppShell level.  It will:
 *   1. On mount, detect an OAuth callback (code + state in the URL).
 *   2. Exchange the code for tokens, persist them, then fetch tasks.
 *   3. On subsequent mounts, reload persisted tokens (refresh if needed)
 *      and re-fetch tasks.
 */

import { useEffect, useCallback, useRef } from 'react'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  exchangeCode,
  refreshAccessToken,
  saveTokens,
  loadTokens,
  clearTokens,
  saveVerifier,
  loadVerifier,
  isExpired,
} from '../lib/googleAuth'
import { fetchTasks, mapGTaskToDayDo } from '../lib/googleTasksApi'
import { useTaskStore } from '../store/taskStore'
import { useToast } from '../store/toastStore'

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    as string | undefined
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined
const STATE_KEY    = 'daydo_google_oauth_state'

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useGoogleTasks() {
  const mergeExternalTasks  = useTaskStore((s) => s.mergeExternalTasks)
  const removeExternalTasks = useTaskStore((s) => s.removeExternalTasks)
  const setGoogleStatus     = useTaskStore((s) => s.setGoogleStatus)
  const googleStatus        = useTaskStore((s) => s.googleStatus)
  const googleError         = useTaskStore((s) => s.googleError)
  const show                = useToast()
  const fetchedOnce         = useRef(false)

  /* ── Fetch & merge tasks ── */

  const syncTasks = useCallback(async (accessToken: string) => {
    setGoogleStatus('loading')
    try {
      const gTasks = await fetchTasks(accessToken)
      const mapped = gTasks.map(mapGTaskToDayDo)
      mergeExternalTasks(mapped)
      setGoogleStatus('connected')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Google Tasks'
      setGoogleStatus('error', msg)
      show(msg, 'error')
    }
  }, [mergeExternalTasks, setGoogleStatus, show])

  /* ── Get a valid access token (refresh if needed) ── */

  const getValidToken = useCallback(async (): Promise<string | null> => {
    let tokens = loadTokens()
    if (!tokens) return null

    if (isExpired(tokens)) {
      if (!tokens.refresh_token || !CLIENT_ID) return null
      try {
        const refreshed = await refreshAccessToken({
          refreshToken: tokens.refresh_token,
          clientId:     CLIENT_ID,
        })
        tokens = { ...tokens, ...refreshed }
        saveTokens(tokens)
      } catch {
        clearTokens()
        setGoogleStatus('idle')
        return null
      }
    }
    return tokens.access_token
  }, [setGoogleStatus])

  /* ── Handle OAuth callback ── */

  useEffect(() => {
    const url    = new URL(window.location.href)
    const code   = url.searchParams.get('code')
    const state  = url.searchParams.get('state')
    const stored = sessionStorage.getItem(STATE_KEY)

    if (!code || state !== stored) return

    // Clean up URL
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, '', url.toString())
    sessionStorage.removeItem(STATE_KEY)

    if (!CLIENT_ID || !REDIRECT_URI) {
      setGoogleStatus('error', 'Missing Google OAuth env vars')
      return
    }

    const verifier = loadVerifier()
    if (!verifier) {
      setGoogleStatus('error', 'PKCE verifier missing')
      return
    }

    setGoogleStatus('connecting')

    exchangeCode({ code, codeVerifier: verifier, clientId: CLIENT_ID, redirectUri: REDIRECT_URI })
      .then((tokens) => {
        saveTokens(tokens)
        return syncTasks(tokens.access_token)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Google auth failed'
        setGoogleStatus('error', msg)
        show(msg, 'error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Restore session on mount ── */

  useEffect(() => {
    if (fetchedOnce.current) return
    const url  = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) return  // handled by callback effect

    getValidToken().then((token) => {
      if (!token) return
      fetchedOnce.current = true
      setGoogleStatus('loading')
      syncTasks(token)
    })
  }, [getValidToken, setGoogleStatus, syncTasks])

  /* ── Public API ── */

  const connect = useCallback(async () => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      show('Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_REDIRECT_URI in .env', 'error')
      return
    }
    const verifier  = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    saveVerifier(verifier)

    const nonce = crypto.randomUUID()
    sessionStorage.setItem(STATE_KEY, nonce)

    const authUrl = buildAuthUrl({
      clientId:      CLIENT_ID,
      redirectUri:   REDIRECT_URI,
      codeChallenge: challenge,
      state:         nonce,
    })
    window.location.href = authUrl
  }, [show])

  const disconnect = useCallback(() => {
    clearTokens()
    removeExternalTasks('Google Tasks')
    setGoogleStatus('idle')
    show('Google Tasks disconnected', 'info')
  }, [removeExternalTasks, setGoogleStatus, show])

  const refetch = useCallback(async () => {
    const token = await getValidToken()
    if (!token) {
      show('Not connected to Google Tasks', 'warning')
      return
    }
    syncTasks(token)
  }, [getValidToken, syncTasks, show])

  return {
    status:    googleStatus,
    error:     googleError,
    connected: googleStatus === 'connected',
    connect,
    disconnect,
    refetch,
  }
}
