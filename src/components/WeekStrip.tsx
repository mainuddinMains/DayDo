import { useMemo } from 'react'
import { useTaskStore }    from '../store/taskStore'
import { useCalendarStore } from '../store/calendarStore'

/* ── Date helpers ──────────────────────────────────────────────────────────── */

const todayISO = new Date().toISOString().slice(0, 10)

/** Return the 7 Date objects for Mon–Sun of the week containing `ref`. */
function getWeekDays(ref: Date): Date[] {
  const d    = new Date(ref)
  const day  = d.getDay()                         // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day           // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const copy = new Date(d)
    copy.setDate(d.getDate() + i)
    return copy
  })
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

/* ── Priority dot colour ───────────────────────────────────────────────────── */

const PRIORITY_DOT: Record<string, string> = {
  high: 'var(--color-danger)',
  med:  'var(--color-warning)',
  low:  'var(--color-text-muted)',
}

/* ── WeekStrip ─────────────────────────────────────────────────────────────── */

export default function WeekStrip() {
  const tasks         = useTaskStore((s) => s.tasks)
  const selectedDate  = useCalendarStore((s) => s.selectedDate)
  const setSelected   = useCalendarStore((s) => s.setSelectedDate)

  const weekDays = getWeekDays(new Date())

  /** Map of ISO date → highest-priority task colour for that day */
  const dotMap = useMemo(() => {
    const map = new Map<string, string>()
    const order = ['high', 'med', 'low'] as const
    for (const task of tasks) {
      const existing = map.get(task.dueDate)
      if (!existing) {
        map.set(task.dueDate, PRIORITY_DOT[task.priority])
      } else {
        // Upgrade to higher priority colour if needed
        const existingIdx = order.findIndex((p) => PRIORITY_DOT[p] === existing)
        const newIdx      = order.indexOf(task.priority)
        if (newIdx < existingIdx) map.set(task.dueDate, PRIORITY_DOT[task.priority])
      }
    }
    return map
  }, [tasks])

  /** Month + year label — handle week spanning two months */
  const monthLabel = useMemo(() => {
    const first = weekDays[0]
    const last  = weekDays[6]
    const fmt   = (d: Date) =>
      new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d)
    if (first.getMonth() === last.getMonth()) return fmt(first)
    return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(first)} – ${fmt(last)}`
  }, [weekDays])

  const handleDayClick = (iso: string) => {
    setSelected(selectedDate === iso ? null : iso)
  }

  return (
    <div className="week-strip">
      {/* Month label */}
      <p className="week-strip__month">{monthLabel}</p>

      {/* Day cells */}
      <div className="week-strip__days" role="group" aria-label="Week day selector">
        {weekDays.map((day) => {
          const iso      = toISO(day)
          const isToday  = iso === todayISO
          const isActive = iso === selectedDate
          const dotColor = dotMap.get(iso)
          const dayName  = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)
          const dayNum   = day.getDate()

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleDayClick(iso)}
              aria-label={`${dayName} ${dayNum}${isToday ? ' (today)' : ''}${isActive ? ', selected' : ''}`}
              aria-pressed={isActive}
              className={[
                'week-day',
                isToday  && 'week-day--today',
                isActive && 'week-day--active',
              ].filter(Boolean).join(' ')}
            >
              <span className="week-day__name">{dayName}</span>
              <span className="week-day__num">{dayNum}</span>
              <span className="week-day__dot-row" aria-hidden="true">
                {dotColor
                  ? <span className="week-day__dot" style={{ background: dotColor }} />
                  : <span className="week-day__dot week-day__dot--empty" />
                }
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
