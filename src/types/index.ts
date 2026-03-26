/* ── Primitives ────────────────────────────────────────────────────────────── */

export type Priority = 'high' | 'med' | 'low'

export type Source =
  | 'Google Tasks'
  | 'Slack'
  | 'Notion'
  | 'Jira'
  | 'DayDo'

/* ── Core entity ───────────────────────────────────────────────────────────── */

export interface Task {
  id:          string
  name:        string
  source:      Source
  sourceColor: string   // hex — drives the source chip colour
  time:        string   // display string, e.g. "09:00 AM"
  priority:    Priority
  done:        boolean
  dueDate:     string   // ISO date string, e.g. "2025-04-02"
  tags:        string[]
  createdAt:   string   // ISO datetime
}

/* ── Store filter state ────────────────────────────────────────────────────── */

export interface TaskFilters {
  priority: Priority | null
  source:   Source   | null
}
