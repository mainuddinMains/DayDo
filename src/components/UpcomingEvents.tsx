import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { MOCK_EVENTS, type CalendarEvent } from '../data/events'

/* ── Date helpers ──────────────────────────────────────────────────────────── */

const todayISO    = new Date().toISOString().slice(0, 10)
const tomorrowISO = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})()

function dayLabel(iso: string): string {
  if (iso === todayISO)    return 'Today'
  if (iso === tomorrowISO) return 'Tomorrow'
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .format(new Date(y, m - 1, d))
}

/* Group events by date, sorted chronologically */
function groupEvents(events: CalendarEvent[]): Array<{ label: string; iso: string; items: CalendarEvent[] }> {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, [])
    map.get(ev.date)!.push(ev)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, items]) => ({
      iso,
      label: dayLabel(iso),
      items: [...items].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
}

/* ── Event card ────────────────────────────────────────────────────────────── */

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="event-card" style={{ '--event-color': event.color } as React.CSSProperties}>
      {/* Colored left bar */}
      <div className="event-card__bar" aria-hidden="true" />

      {/* Time column */}
      <div className="event-card__time-col">
        <span className="event-card__start">{event.startTime}</span>
        <span className="event-card__end">{event.endTime}</span>
      </div>

      {/* Content */}
      <div className="event-card__content">
        <span className="event-card__title">{event.title}</span>
        <div className="event-card__meta">
          <span
            className="event-card__source-dot"
            style={{ background: event.sourceColor }}
            aria-hidden="true"
          />
          <span className="event-card__source">{event.source}</span>
          {event.location && (
            <>
              <span className="event-card__meta-sep" aria-hidden="true">·</span>
              <span className="event-card__location">{event.location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Section group ─────────────────────────────────────────────────────────── */

function EventGroup({ label, items }: { label: string; items: CalendarEvent[] }) {
  return (
    <div className="events-group">
      <p className="events-group__label">{label}</p>
      <div className="events-group__list">
        {items.map((ev) => <EventCard key={ev.id} event={ev} />)}
      </div>
    </div>
  )
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */

export default function UpcomingEvents() {
  const groups = useMemo(() => groupEvents(MOCK_EVENTS), [])
  const total  = MOCK_EVENTS.length

  return (
    <aside className="events-panel" aria-label="Upcoming events">

      {/* Header */}
      <div className="events-panel__header">
        <div className="events-panel__title-row">
          <CalendarDays size={15} strokeWidth={1.75} className="events-panel__icon" />
          <h2 className="events-panel__title">Upcoming</h2>
        </div>
        <span className="events-panel__count">{total}</span>
      </div>

      {/* Scrollable body */}
      <div className="events-panel__body">
        {groups.map((g) => (
          <EventGroup key={g.iso} label={g.label} items={g.items} />
        ))}
      </div>

    </aside>
  )
}
