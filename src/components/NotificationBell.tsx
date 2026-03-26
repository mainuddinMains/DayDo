import { useRef, useEffect, useState } from 'react'
import {
  Bell,
  Plus,
  CheckCircle2,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useNotificationStore, type NotifType } from '../store/notificationStore'

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function formatRelativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 5)   return 'just now'
  if (secs < 60)  return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

/* ── Per-type config ────────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<
  NotifType,
  { icon: React.ReactNode; label: (name: string) => string }
> = {
  task_added: {
    icon:  <Plus size={13} strokeWidth={2} />,
    label: (n) => `"${truncate(n)}" was added`,
  },
  task_completed: {
    icon:  <CheckCircle2 size={13} strokeWidth={2} />,
    label: (n) => `"${truncate(n)}" marked complete`,
  },
  task_uncompleted: {
    icon:  <RotateCcw size={13} strokeWidth={2} />,
    label: (n) => `"${truncate(n)}" marked incomplete`,
  },
  task_deleted: {
    icon:  <Trash2 size={13} strokeWidth={2} />,
    label: (n) => `"${truncate(n)}" was deleted`,
  },
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef   = useRef<HTMLDivElement>(null)

  const notifications  = useNotificationStore((s) => s.notifications)
  const unreadCount    = useNotificationStore((s) =>
    s.notifications.filter((n) => !n.read).length
  )
  const markAllRead    = useNotificationStore((s) => s.markAllRead)
  const dismiss        = useNotificationStore((s) => s.dismiss)
  const clearAll       = useNotificationStore((s) => s.clearAll)

  /* Close on outside click */
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) markAllRead()
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        type="button"
        className={`notif-bell__btn ${open ? 'notif-bell__btn--open' : ''}`}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="notif-bell__badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown"
          role="dialog"
          aria-label="Recent activity"
        >
          {/* Header */}
          <div className="notif-dropdown__header">
            <span className="notif-dropdown__title">Activity</span>
            {notifications.length > 0 && (
              <button
                type="button"
                className="notif-dropdown__clear"
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Body */}
          {notifications.length === 0 ? (
            <div className="notif-dropdown__empty">
              <Bell size={22} strokeWidth={1.25} />
              <span>No recent activity</span>
            </div>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type]
                return (
                  <li
                    key={n.id}
                    className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
                  >
                    <span className={`notif-item__icon notif-item__icon--${n.type}`}>
                      {cfg.icon}
                    </span>

                    <div className="notif-item__body">
                      <span className="notif-item__text">{cfg.label(n.taskName)}</span>
                      <span className="notif-item__time">
                        {formatRelativeTime(n.timestamp)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="notif-item__dismiss"
                      onClick={() => dismiss(n.id)}
                      aria-label="Dismiss notification"
                    >
                      <X size={12} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
