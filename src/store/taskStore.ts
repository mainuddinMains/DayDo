import { create } from 'zustand'
import type { Task, Priority, Source, TaskFilters } from '../types'
import { useToastStore }        from './toastStore'
import { useNotificationStore } from './notificationStore'

function truncate(s: string, max = 32): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

/* ── Source colour map ─────────────────────────────────────────────────────── */

export const SOURCE_COLORS: Record<Source, string> = {
  'Google Tasks': '#4285f4',
  'Slack':        '#e01e5a',
  'Notion':       '#ffffff',
  'Jira':         '#0052cc',
  'DayDo':        '#c9a96e',
}

/* ── Seed data ─────────────────────────────────────────────────────────────── */

const SEED_TASKS: Task[] = [
  {
    id:          '1',
    name:        'Review Q2 product roadmap',
    source:      'Notion',
    sourceColor: SOURCE_COLORS['Notion'],
    time:        '09:00 AM',
    priority:    'high',
    done:        false,
    dueDate:     '2026-03-25',
    tags:        ['roadmap', 'product', 'meeting'],
    createdAt:   '2025-03-28T08:00:00.000Z',
  },
  {
    id:          '2',
    name:        'Fix login redirect bug on Safari',
    source:      'Jira',
    sourceColor: SOURCE_COLORS['Jira'],
    time:        '10:30 AM',
    priority:    'high',
    done:        false,
    dueDate:     '2026-03-25',
    tags:        ['bug', 'frontend', 'auth'],
    createdAt:   '2025-03-27T09:15:00.000Z',
  },
  {
    id:          '3',
    name:        'Respond to design feedback in #product channel',
    source:      'Slack',
    sourceColor: SOURCE_COLORS['Slack'],
    time:        '11:00 AM',
    priority:    'med',
    done:        false,
    dueDate:     '2026-03-25',
    tags:        ['design', 'feedback', 'meeting'],
    createdAt:   '2025-03-28T10:00:00.000Z',
  },
  {
    id:          '4',
    name:        'Set up weekly team sync on Google Calendar',
    source:      'Google Tasks',
    sourceColor: SOURCE_COLORS['Google Tasks'],
    time:        '01:00 PM',
    priority:    'med',
    done:        true,
    dueDate:     '2025-03-29',
    tags:        ['calendar', 'team'],
    createdAt:   '2025-03-26T11:00:00.000Z',
  },
  {
    id:          '5',
    name:        'Write sprint retrospective notes',
    source:      'Notion',
    sourceColor: SOURCE_COLORS['Notion'],
    time:        '02:00 PM',
    priority:    'low',
    done:        false,
    dueDate:     '2025-04-03',
    tags:        ['sprint', 'docs'],
    createdAt:   '2025-03-28T13:00:00.000Z',
  },
  {
    id:          '6',
    name:        'Implement task drag-and-drop reordering',
    source:      'Jira',
    sourceColor: SOURCE_COLORS['Jira'],
    time:        '03:00 PM',
    priority:    'high',
    done:        false,
    dueDate:     '2025-04-04',
    tags:        ['feature', 'ui'],
    createdAt:   '2025-03-25T14:00:00.000Z',
  },
  {
    id:          '7',
    name:        'Block 2 hours for deep work — no meetings',
    source:      'DayDo',
    sourceColor: SOURCE_COLORS['DayDo'],
    time:        '04:00 PM',
    priority:    'med',
    done:        false,
    dueDate:     '2026-03-25',
    tags:        ['focus', 'personal', 'meeting'],
    createdAt:   '2025-03-28T07:00:00.000Z',
  },
  {
    id:          '8',
    name:        'Follow up with design team on new icon set',
    source:      'Slack',
    sourceColor: SOURCE_COLORS['Slack'],
    time:        '05:00 PM',
    priority:    'low',
    done:        false,
    dueDate:     '2025-04-02',
    tags:        ['design', 'assets'],
    createdAt:   '2025-03-27T16:00:00.000Z',
  },
  {
    id:          '9',
    name:        'Prepare onboarding doc for new engineer',
    source:      'Notion',
    sourceColor: SOURCE_COLORS['Notion'],
    time:        '09:30 AM',
    priority:    'med',
    done:        true,
    dueDate:     '2025-03-30',
    tags:        ['onboarding', 'docs'],
    createdAt:   '2025-03-24T09:00:00.000Z',
  },
  {
    id:          '10',
    name:        'Update API rate-limit handling in backend',
    source:      'Jira',
    sourceColor: SOURCE_COLORS['Jira'],
    time:        '11:30 AM',
    priority:    'high',
    done:        false,
    dueDate:     '2025-04-01',
    tags:        ['backend', 'api', 'bug'],
    createdAt:   '2025-03-26T10:30:00.000Z',
  },
  {
    id:          '11',
    name:        'Review and merge open pull requests',
    source:      'Google Tasks',
    sourceColor: SOURCE_COLORS['Google Tasks'],
    time:        '02:30 PM',
    priority:    'med',
    done:        false,
    dueDate:     '2026-03-25',
    tags:        ['code-review', 'github'],
    createdAt:   '2025-03-28T08:30:00.000Z',
  },
  {
    id:          '12',
    name:        'Plan personal goals for April',
    source:      'DayDo',
    sourceColor: SOURCE_COLORS['DayDo'],
    time:        '07:00 PM',
    priority:    'low',
    done:        false,
    dueDate:     '2025-04-05',
    tags:        ['personal', 'goals'],
    createdAt:   '2025-03-28T06:00:00.000Z',
  },
]

/* ── Store shape ───────────────────────────────────────────────────────────── */

export type IntegrationStatus = 'idle' | 'connecting' | 'loading' | 'connected' | 'error'

interface TaskState {
  tasks:        Task[]
  filters:      TaskFilters
  searchQuery:  string
  focusStreak:  number

  // Integration statuses
  googleStatus: IntegrationStatus
  googleError:  string | null
  slackStatus:  IntegrationStatus
  slackError:   string | null

  // Mutations
  addTask:    (task: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void

  // External sync — upsert by id, bulk-remove by source
  mergeExternalTasks:  (tasks: Task[]) => void
  removeExternalTasks: (source: string) => void
  setGoogleStatus:     (s: IntegrationStatus, error?: string | null) => void
  setSlackStatus:      (s: IntegrationStatus, error?: string | null) => void

  // Filters
  filterByPriority: (priority: Priority | null) => void
  filterBySource:   (source: Source | null) => void
  clearFilters:     () => void

  // Search
  setSearchQuery: (q: string) => void

  filteredTasks: () => Task[]
}

/* ── Store ─────────────────────────────────────────────────────────────────── */

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks:       SEED_TASKS,
  filters:     { priority: null, source: null },
  searchQuery: '',
  focusStreak: 7,

  googleStatus: 'idle',
  googleError:  null,
  slackStatus:  'idle',
  slackError:   null,

  /* ── External sync ── */

  mergeExternalTasks: (incoming) =>
    set((state) => {
      const incomingMap = new Map(incoming.map((t) => [t.id, t]))
      const updated = state.tasks.map((t) =>
        incomingMap.has(t.id) ? { ...incomingMap.get(t.id)!, done: t.done } : t
      )
      const existingIds = new Set(state.tasks.map((t) => t.id))
      const toAdd = incoming.filter((t) => !existingIds.has(t.id))
      return { tasks: [...toAdd, ...updated] }
    }),

  removeExternalTasks: (source) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.source !== source) })),

  setGoogleStatus: (s, error = null) =>
    set({ googleStatus: s, googleError: error ?? null }),

  setSlackStatus: (s, error = null) =>
    set({ slackStatus: s, slackError: error ?? null }),

  /* ── Mutations ── */

  addTask: (payload) => {
    set((state) => ({
      tasks: [
        {
          ...payload,
          id:        crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...state.tasks,
      ],
    }))
    const label = truncate(payload.name)
    useToastStore.getState().show(`"${label}" added`, 'success')
    useNotificationStore.getState().add('task_added', payload.name)
  },

  toggleTask: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }))
    const nowDone = !task.done
    const label   = truncate(task.name)
    useToastStore.getState().show(
      nowDone ? `"${label}" marked complete` : `"${label}" marked incomplete`,
      nowDone ? 'success' : 'info',
    )
    useNotificationStore.getState().add(
      nowDone ? 'task_completed' : 'task_uncompleted',
      task.name,
    )
  },

  deleteTask: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }))
    if (task) {
      const label = truncate(task.name)
      useToastStore.getState().show(`"${label}" deleted`, 'info')
      useNotificationStore.getState().add('task_deleted', task.name)
    }
  },

  /* ── Filters ── */

  filterByPriority: (priority) =>
    set((state) => ({ filters: { ...state.filters, priority } })),

  filterBySource: (source) =>
    set((state) => ({ filters: { ...state.filters, source } })),

  clearFilters: () =>
    set({ filters: { priority: null, source: null } }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  /* ── Derived ── */

  filteredTasks: () => {
    const { tasks, filters, searchQuery } = get()
    const q = searchQuery.trim().toLowerCase()
    return tasks.filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.source   && t.source   !== filters.source)   return false
      if (q) {
        const inName   = t.name.toLowerCase().includes(q)
        const inSource = t.source.toLowerCase().includes(q)
        const inTags   = t.tags.some((tag) => tag.toLowerCase().includes(q))
        if (!inName && !inSource && !inTags) return false
      }
      return true
    })
  },
}))
