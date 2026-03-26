import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, CalendarClock, Video, Flame } from 'lucide-react'
import { useStatsRow } from '../hooks/useTasks'

/* ── Animated progress bar ─────────────────────────────────────────────────── */

function ProgressBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // Let the browser paint the 0% state first, then drive to target
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth(pct))
    })
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div className="stat-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="stat-progress__fill"
        style={{ width: `${width}%` }}
      />
      {/* Shimmer overlay — only visible while animating */}
      <div className="stat-progress__shimmer" style={{ width: `${width}%` }} />
    </div>
  )
}

/* ── Individual card ───────────────────────────────────────────────────────── */

interface StatCardProps {
  icon:      ReactNode
  iconClass: string
  label:     string
  value:     number | string
  sub?:      string
  children?: ReactNode
}

function StatCard({ icon, iconClass, label, value, sub, children }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className={`stat-card__icon ${iconClass}`}>{icon}</span>
        <span className="stat-card__label">{label}</span>
      </div>

      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        {sub && <span className="stat-card__sub">{sub}</span>}
      </div>

      {children}
    </div>
  )
}

/* ── Stats row ─────────────────────────────────────────────────────────────── */

export default function StatsRow() {
  const { total, done, pct, dueToday, meetings, focusStreak } = useStatsRow()
  const prevPct = useRef(pct)

  // Re-animate bar whenever pct changes after mount
  useEffect(() => { prevPct.current = pct }, [pct])

  return (
    <div className="stats-row">

      {/* 1 — Completed */}
      <StatCard
        icon={<CheckCircle2 size={15} strokeWidth={1.75} />}
        iconClass="stat-card__icon--green"
        label="Completed"
        value={`${done} / ${total}`}
        sub={`${pct}% done`}
      >
        <ProgressBar pct={pct} />
      </StatCard>

      {/* 2 — Due Today */}
      <StatCard
        icon={<CalendarClock size={15} strokeWidth={1.75} />}
        iconClass="stat-card__icon--gold"
        label="Due Today"
        value={dueToday}
        sub={dueToday === 1 ? 'task remaining' : 'tasks remaining'}
      />

      {/* 3 — Meetings */}
      <StatCard
        icon={<Video size={15} strokeWidth={1.75} />}
        iconClass="stat-card__icon--blue"
        label="Meetings"
        value={meetings}
        sub={meetings === 1 ? 'scheduled today' : 'scheduled today'}
      />

      {/* 4 — Focus Streak */}
      <StatCard
        icon={<Flame size={15} strokeWidth={1.75} />}
        iconClass="stat-card__icon--orange"
        label="Focus Streak"
        value={focusStreak}
        sub={focusStreak === 1 ? 'day in a row' : 'days in a row'}
      />

    </div>
  )
}
