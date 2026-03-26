import { useState } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { useTaskStore }     from '../store/taskStore'
import { useCalendarStore } from '../store/calendarStore'
import type { Task, Priority } from '../types'

/* ─────────────────────────────────────────────────────────────────────────────
   Filter chip definitions
───────────────────────────────────────────────────────────────────────────── */

type Chip = 'all' | 'high' | 'pending' | 'slack'

const CHIPS: { id: Chip; label: string }[] = [
  { id: 'all',     label: 'All'     },
  { id: 'high',    label: 'High'    },
  { id: 'pending', label: 'Pending' },
  { id: 'slack',   label: 'Slack'   },
]

/* ─────────────────────────────────────────────────────────────────────────────
   Priority tag config
───────────────────────────────────────────────────────────────────────────── */

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'task-priority--high' },
  med:  { label: 'Med',  cls: 'task-priority--med'  },
  low:  { label: 'Low',  cls: 'task-priority--low'  },
}

/* ─────────────────────────────────────────────────────────────────────────────
   Circular checkbox
───────────────────────────────────────────────────────────────────────────── */

function TaskCheckbox({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <button
      className={`task-checkbox ${done ? 'task-checkbox--done' : ''}`}
      onClick={onToggle}
      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      type="button"
    >
      {/* Animated check SVG */}
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polyline
          className="task-checkbox__check"
          points="3,8 6.5,11.5 13,4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Single task row
───────────────────────────────────────────────────────────────────────────── */

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const priority = PRIORITY_META[task.priority]

  return (
    <li className={`task-item ${task.done ? 'task-item--done' : ''}`}>
      {/* Left: checkbox */}
      <TaskCheckbox done={task.done} onToggle={() => onToggle(task.id)} />

      {/* Centre: name + meta row */}
      <div className="task-item__body">
        <span className="task-item__name">{task.name}</span>

        <div className="task-item__meta">
          {/* Source badge */}
          <span className="task-source">
            <span
              className="task-source__dot"
              style={{ background: task.sourceColor }}
            />
            {task.source}
          </span>

          {/* Time */}
          <span className="task-meta-divider" aria-hidden="true">·</span>
          <span className="task-time">
            <Clock size={11} strokeWidth={1.75} aria-hidden="true" />
            {task.time}
          </span>
        </div>
      </div>

      {/* Right: priority tag */}
      <span className={`task-priority ${priority.cls}`}>
        {priority.label}
      </span>
    </li>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Filter chips bar
───────────────────────────────────────────────────────────────────────────── */

function FilterChips({
  active,
  counts,
  onChange,
}: {
  active:   Chip
  counts:   Record<Chip, number>
  onChange: (c: Chip) => void
}) {
  return (
    <div className="filter-chips" role="group" aria-label="Filter tasks">
      {CHIPS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`filter-chip ${active === id ? 'filter-chip--active' : ''}`}
          onClick={() => onChange(id)}
          aria-pressed={active === id}
        >
          {label}
          <span className="filter-chip__count">{counts[id]}</span>
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TaskList
───────────────────────────────────────────────────────────────────────────── */

/* ── Date label helper ─────────────────────────────────────────────────────── */

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).format(new Date(y, m - 1, d))
}

/* ─────────────────────────────────────────────────────────────────────────────
   TaskList
───────────────────────────────────────────────────────────────────────────── */

export default function TaskList() {
  const [activeChip, setActiveChip] = useState<Chip>('all')
  const tasks        = useTaskStore((s) => s.tasks)
  const toggleTask   = useTaskStore((s) => s.toggleTask)
  const slackStatus  = useTaskStore((s) => s.slackStatus)
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const clearDate    = useCalendarStore((s) => s.setSelectedDate)

  /* Pool: tasks passing the calendar date filter */
  const datePool = selectedDate
    ? tasks.filter((t) => t.dueDate === selectedDate)
    : tasks

  /* Chip counts — derived from the date-filtered pool */
  const counts: Record<Chip, number> = {
    all:     datePool.length,
    high:    datePool.filter((t) => t.priority === 'high').length,
    pending: datePool.filter((t) => !t.done).length,
    slack:   datePool.filter((t) => t.source === 'Slack').length,
  }

  /* Apply chip filter on top */
  const visible = datePool.filter((t) => {
    if (activeChip === 'high')    return t.priority === 'high'
    if (activeChip === 'pending') return !t.done
    if (activeChip === 'slack')   return t.source === 'Slack'
    return true
  })

  /* Sort: pending first, then done; within each group sort by time */
  const sorted = [...visible].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.time.localeCompare(b.time)
  })

  const title       = selectedDate ? formatDateLabel(selectedDate) : 'Tasks'
  const emptyMsg    = selectedDate ? 'No tasks due on this day.' : 'No tasks match this filter.'

  return (
    <section className="task-list-section">
      {/* Slack loading banner */}
      {(activeChip === 'slack' || slackStatus === 'loading') && slackStatus === 'loading' && (
        <div className="task-list-banner task-list-banner--loading">
          <Loader2 size={13} className="task-list-banner__spinner" aria-hidden="true" />
          Syncing Slack tasks…
        </div>
      )}

      <div className="task-list-section__header">
        <div className="task-list-section__title-group">
          <h2 className="task-list-section__title">{title}</h2>
          {selectedDate && (
            <button
              type="button"
              className="task-list-section__clear"
              onClick={() => clearDate(null)}
              aria-label="Show all days"
            >
              Show all
            </button>
          )}
        </div>
        <FilterChips active={activeChip} counts={counts} onChange={setActiveChip} />
      </div>

      {sorted.length === 0 ? (
        <div className="task-list-empty">
          <span>{emptyMsg}</span>
        </div>
      ) : (
        <ul className="task-list">
          {sorted.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </ul>
      )}
    </section>
  )
}
