/**
 * Google Tasks REST API v1 client + DayDo type mapper.
 * API reference: https://developers.google.com/tasks/reference/rest
 */

import type { Task } from '../types'
import { SOURCE_COLORS } from '../store/taskStore'

const BASE = 'https://tasks.googleapis.com/tasks/v1'

/* ── Google Tasks API shapes ───────────────────────────────────────────────── */

export interface GTaskList {
  kind:    'tasks#taskList'
  id:      string
  title:   string
  updated: string   // RFC 3339
  selfLink: string
}

export interface GTask {
  kind:       'tasks#task'
  id:         string
  title:      string
  updated:    string              // RFC 3339 — last modified
  selfLink:   string
  parent?:    string
  position:   string
  notes?:     string              // free-text; we'll parse as comma-separated tags
  status:     'needsAction' | 'completed'
  due?:       string              // RFC 3339 — only date part is meaningful
  completed?: string              // RFC 3339 — when it was completed
  deleted?:   boolean
  hidden?:    boolean
  links?:     Array<{ type: string; description: string; link: string }>
}

/* ── Fetch helpers ─────────────────────────────────────────────────────────── */

async function get<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept:        'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      error?: { message?: string; status?: string }
    }
    const msg = body.error?.message ?? `Google Tasks API error ${res.status}`
    throw new Error(msg)
  }
  return res.json() as T
}

/** Fetch all task lists belonging to the authenticated user. */
export async function fetchTaskLists(accessToken: string): Promise<GTaskList[]> {
  const data = await get<{ items?: GTaskList[] }>('/users/@me/lists', accessToken)
  return data.items ?? []
}

/** Fetch tasks from a specific task list (defaults to the primary list). */
export async function fetchTasks(
  accessToken:  string,
  tasklistId:   string = '@default',
  options:      { showCompleted?: boolean } = {},
): Promise<GTask[]> {
  const params = new URLSearchParams({
    maxResults:    '100',
    showCompleted: String(options.showCompleted ?? true),
    showHidden:    'false',
  })
  const data = await get<{ items?: GTask[]; nextPageToken?: string }>(
    `/lists/${encodeURIComponent(tasklistId)}/tasks?${params}`,
    accessToken,
  )
  return (data.items ?? []).filter((t) => !t.deleted && !t.hidden)
}

/* ── Type mapper ───────────────────────────────────────────────────────────── */

/**
 * Extracts a display-friendly time string from an ISO datetime.
 * Google Tasks stores `due` as "2026-03-25T00:00:00.000Z" (midnight UTC).
 * We use `updated` for the time portion when `due` has no meaningful time.
 */
function extractTime(due?: string, updated?: string): string {
  const src = updated ?? due
  if (!src) return '09:00 AM'
  const d = new Date(src)
  if (isNaN(d.getTime())) return '09:00 AM'
  return new Intl.DateTimeFormat('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d)
}

/** Extracts the ISO date string (YYYY-MM-DD) from an RFC 3339 datetime. */
function extractDate(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  // `due` comes as "2026-03-25T00:00:00.000Z" — the date portion is in UTC
  return iso.slice(0, 10)
}

/**
 * Parses the `notes` field into tags.
 * Treats comma- or newline-separated words as tag candidates.
 * Ignores notes that look like full sentences (> 40 chars total).
 */
function parseTags(notes?: string): string[] {
  if (!notes || notes.length > 120) return []
  return notes
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((t) => t.length > 0 && t.length <= 24)
    .slice(0, 5)
}

/** Maps a GTask to the DayDo Task type. */
export function mapGTaskToDayDo(gTask: GTask): Task {
  return {
    id:          `gtask-${gTask.id}`,
    name:        gTask.title?.trim() || '(Untitled)',
    source:      'Google Tasks',
    sourceColor: SOURCE_COLORS['Google Tasks'],
    time:        extractTime(gTask.due, gTask.updated),
    priority:    'med',   // Google Tasks has no native priority — default to med
    done:        gTask.status === 'completed',
    dueDate:     extractDate(gTask.due),
    tags:        parseTags(gTask.notes),
    createdAt:   gTask.updated,
  }
}
