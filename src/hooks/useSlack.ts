/**
 * useSlack — orchestrates Slack OAuth2 flow + task sync.
 *
 * Call this hook once at the AppShell level.  It will:
 *   1. On mount, detect a Slack OAuth callback (?code=… in URL).
 *   2. Exchange the code for a token, persist it, then fetch tasks.
 *   3. On subsequent mounts, reload the persisted token and re-fetch.
 */

import { useEffect, useCallback, useRef } from 'react'
import {
  buildSlackAuthUrl,
  exchangeSlackCode,
  saveSlackToken,
  loadSlackToken,
  clearSlackToken,
  fetchMentions,
  fetchStarred,
  mapMentionToDayDo,
  mapStarredToDayDo,
} from '../lib/slackApi'
import { useTaskStore } from '../store/taskStore'
import { useToast } from '../store/toastStore'

const CLIENT_ID     = import.meta.env.VITE_SLACK_CLIENT_ID     as string | undefined
const CLIENT_SECRET = import.meta.env.VITE_SLACK_CLIENT_SECRET as string | undefined
const REDIRECT_URI  = import.meta.env.VITE_SLACK_REDIRECT_URI  as string | undefined
const STATE_KEY     = 'daydo_slack_oauth_state'

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useSlack() {
  const mergeExternalTasks  = useTaskStore((s) => s.mergeExternalTasks)
  const removeExternalTasks = useTaskStore((s) => s.removeExternalTasks)
  const setSlackStatus      = useTaskStore((s) => s.setSlackStatus)
  const slackStatus         = useTaskStore((s) => s.slackStatus)
  const slackError          = useTaskStore((s) => s.slackError)
  const show                = useToast()
  const fetchedOnce         = useRef(false)

  /* ── Fetch & merge tasks ── */

  const syncTasks = useCallback(async (accessToken: string) => {
    setSlackStatus('loading')
    try {
      const [mentions, starred] = await Promise.all([
        fetchMentions(accessToken).catch(() => []),
        fetchStarred(accessToken).catch(() => []),
      ])

      const mentionTasks = mentions.map(mapMentionToDayDo)
      const starredTasks = starred
        .map(mapStarredToDayDo)
        .filter((t): t is NonNullable<typeof t> => t !== null)

      // Deduplicate by id
      const seen = new Set<string>()
      const all  = [...mentionTasks, ...starredTasks].filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })

      mergeExternalTasks(all)
      setSlackStatus('connected')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Slack tasks'
      setSlackStatus('error', msg)
      show(msg, 'error')
    }
  }, [mergeExternalTasks, setSlackStatus, show])

  /* ── Handle OAuth callback ── */

  useEffect(() => {
    const url    = new URL(window.location.href)
    const code   = url.searchParams.get('code')
    const state  = url.searchParams.get('state')
    const stored = sessionStorage.getItem(STATE_KEY)

    // Slack callback has both code and state; Google callback uses a different state prefix
    if (!code || !state || state !== stored) return
    // Make sure this is a Slack callback, not Google
    if (!state.startsWith('slack-')) return

    // Clean up URL
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, '', url.toString())
    sessionStorage.removeItem(STATE_KEY)

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      setSlackStatus('error', 'Missing Slack OAuth env vars')
      return
    }

    setSlackStatus('connecting')

    exchangeSlackCode({ code, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI })
      .then((token) => {
        saveSlackToken(token)
        show(`Connected to ${token.team_name}`, 'success')
        return syncTasks(token.access_token)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Slack auth failed'
        setSlackStatus('error', msg)
        show(msg, 'error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Restore session on mount ── */

  useEffect(() => {
    if (fetchedOnce.current) return
    const url  = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) return  // handled by callback effect

    const token = loadSlackToken()
    if (!token) return

    fetchedOnce.current = true
    syncTasks(token.access_token)
  }, [syncTasks])

  /* ── Public API ── */

  const connect = useCallback(() => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      show('Set VITE_SLACK_CLIENT_ID and VITE_SLACK_REDIRECT_URI in .env', 'error')
      return
    }
    const nonce = `slack-${crypto.randomUUID()}`
    sessionStorage.setItem(STATE_KEY, nonce)

    window.location.href = buildSlackAuthUrl({
      clientId:    CLIENT_ID,
      redirectUri: REDIRECT_URI,
      state:       nonce,
    })
  }, [show])

  const disconnect = useCallback(() => {
    clearSlackToken()
    removeExternalTasks('Slack')
    setSlackStatus('idle')
    show('Slack disconnected', 'info')
  }, [removeExternalTasks, setSlackStatus, show])

  const refetch = useCallback(async () => {
    const token = loadSlackToken()
    if (!token) {
      show('Not connected to Slack', 'warning')
      return
    }
    syncTasks(token.access_token)
  }, [syncTasks, show])

  return {
    status:    slackStatus,
    error:     slackError,
    connected: slackStatus === 'connected',
    connect,
    disconnect,
    refetch,
  }
}
