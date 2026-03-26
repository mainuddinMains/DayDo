/**
 * Slack Web API client + DayDo type mapper.
 * API reference: https://api.slack.com/methods
 *
 * OAuth2 flow (standard code exchange — no PKCE):
 *   1. Redirect user to buildSlackAuthUrl()
 *   2. Slack redirects back with ?code=…
 *   3. Call exchangeSlackCode() to get an access token
 *   4. Use the token with fetchMentions() / fetchStarred()
 *
 * Required env vars:
 *   VITE_SLACK_CLIENT_ID
 *   VITE_SLACK_CLIENT_SECRET
 *   VITE_SLACK_REDIRECT_URI
 *
 * Required OAuth scopes (Bot Token):
 *   search:read, stars:read, users:read
 */

import type { Task } from '../types'
import { SOURCE_COLORS } from '../store/taskStore'

const STORAGE_KEY = 'daydo_slack_token'
const BASE        = 'https://slack.com/api'

/* ── Slack API shapes ──────────────────────────────────────────────────────── */

export interface SlackToken {
  access_token: string
  token_type:   string
  scope:        string
  team_id:      string
  team_name:    string
  authed_user:  { id: string }
}

interface SlackMessage {
  iid:        string
  type:       string
  text:       string
  username:   string
  ts:         string
  channel: {
    id:   string
    name: string
  }
  permalink:  string
}

interface SlackFile {
  id:         string
  name:       string
  title:      string
  created:    number
  permalink:  string
  channels:   string[]
}

interface SlackStarItem {
  type:     'message' | 'file' | string
  message?: SlackMessage
  file?:    SlackFile
  channel?: string
}

/* ── Token storage ─────────────────────────────────────────────────────────── */

export function saveSlackToken(token: SlackToken): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
}

export function loadSlackToken(): SlackToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SlackToken) : null
  } catch {
    return null
  }
}

export function clearSlackToken(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/* ── OAuth helpers ─────────────────────────────────────────────────────────── */

export function buildSlackAuthUrl(params: {
  clientId:    string
  redirectUri: string
  state?:      string
}): string {
  const url = new URL('https://slack.com/oauth/v2/authorize')
  url.searchParams.set('client_id',    params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('scope',        'search:read,stars:read,users:read')
  url.searchParams.set('user_scope',   'search:read,stars:read')
  if (params.state) url.searchParams.set('state', params.state)
  return url.toString()
}

export async function exchangeSlackCode(params: {
  code:         string
  clientId:     string
  clientSecret: string
  redirectUri:  string
}): Promise<SlackToken> {
  const body = new URLSearchParams({
    code:          params.code,
    client_id:     params.clientId,
    client_secret: params.clientSecret,
    redirect_uri:  params.redirectUri,
  })

  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json() as { ok: boolean; error?: string } & Partial<SlackToken>
  if (!data.ok) throw new Error(data.error ?? 'Slack OAuth failed')
  return data as SlackToken
}

/* ── Fetch helpers ─────────────────────────────────────────────────────────── */

async function slackGet<T>(method: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}/${method}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/json',
    },
  })

  const data = await res.json() as { ok: boolean; error?: string } & T
  if (!data.ok) throw new Error(data.error ?? `Slack API error: ${method}`)
  return data
}

/* ── Fetch mentions (@me) ──────────────────────────────────────────────────── */

export async function fetchMentions(accessToken: string): Promise<SlackMessage[]> {
  const data = await slackGet<{ messages: { matches: SlackMessage[] } }>(
    'search.messages',
    accessToken,
    { query: '<@me>', count: '20', sort: 'timestamp', sort_dir: 'desc' },
  )
  return data.messages?.matches ?? []
}

/* ── Fetch starred items ───────────────────────────────────────────────────── */

export async function fetchStarred(accessToken: string): Promise<SlackStarItem[]> {
  const data = await slackGet<{ items: SlackStarItem[] }>(
    'stars.list',
    accessToken,
    { count: '20' },
  )
  return data.items ?? []
}

/* ── Type mapper ───────────────────────────────────────────────────────────── */

function tsToIso(ts: string): string {
  const ms = Math.floor(parseFloat(ts) * 1000)
  return new Date(ms).toISOString()
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso))
}

function truncate(text: string, max = 80): string {
  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

/** Maps a Slack mention (search result message) to a DayDo Task. */
export function mapMentionToDayDo(msg: SlackMessage): Task {
  const iso = tsToIso(msg.ts)
  return {
    id:          `slack-mention-${msg.iid ?? msg.ts}`,
    name:        truncate(msg.text) || '(Slack mention)',
    source:      'Slack',
    sourceColor: SOURCE_COLORS['Slack'],
    time:        formatTime(iso),
    priority:    'med',
    done:        false,
    dueDate:     iso.slice(0, 10),
    tags:        ['mention', msg.channel?.name].filter(Boolean) as string[],
    createdAt:   iso,
  }
}

/** Maps a Slack starred message to a DayDo Task. */
export function mapStarredToDayDo(item: SlackStarItem): Task | null {
  if (item.type === 'message' && item.message) {
    const msg = item.message
    const iso = tsToIso(msg.ts)
    return {
      id:          `slack-starred-${msg.ts}`,
      name:        truncate(msg.text) || '(Starred message)',
      source:      'Slack',
      sourceColor: SOURCE_COLORS['Slack'],
      time:        formatTime(iso),
      priority:    'high',
      done:        false,
      dueDate:     iso.slice(0, 10),
      tags:        ['starred', item.channel ?? msg.channel?.name].filter(Boolean) as string[],
      createdAt:   iso,
    }
  }
  if (item.type === 'file' && item.file) {
    const iso = new Date(item.file.created * 1000).toISOString()
    return {
      id:          `slack-file-${item.file.id}`,
      name:        `Review: ${item.file.title || item.file.name}`,
      source:      'Slack',
      sourceColor: SOURCE_COLORS['Slack'],
      time:        formatTime(iso),
      priority:    'low',
      done:        false,
      dueDate:     iso.slice(0, 10),
      tags:        ['starred', 'file'],
      createdAt:   iso,
    }
  }
  return null
}
