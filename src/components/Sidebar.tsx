import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  CalendarClock,
  CalendarRange,
  CheckSquare,
  Hash,
  BookOpen,
  Layers,
  Zap,
  User,
  Plus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useModalStore } from '../store/modalStore'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface NavItem {
  to:     string
  icon:   LucideIcon
  label:  string
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

/* ── Nav config ────────────────────────────────────────────────────────────── */
const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/',          icon: CalendarDays,  label: 'Today',    badge: 5 },
      { to: '/upcoming',  icon: CalendarClock, label: 'Upcoming', badge: 12 },
      { to: '/calendar',  icon: CalendarRange, label: 'Calendar' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { to: '/google-tasks', icon: CheckSquare, label: 'Google Tasks', badge: 3 },
      { to: '/slack',        icon: Hash,        label: 'Slack',        badge: 7 },
      { to: '/notion',       icon: BookOpen,    label: 'Notion' },
      { to: '/jira',         icon: Layers,      label: 'Jira',         badge: 2 },
    ],
  },
  {
    title: 'Personal',
    items: [
      { to: '/focus',   icon: Zap,  label: 'Focus Mode' },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
  },
]

/* ── Sub-components ────────────────────────────────────────────────────────── */
function Badge({ count }: { count: number }) {
  return (
    <span className="sidebar__badge" aria-label={`${count} items`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SidebarLink({ item, onClose, isMobile }: {
  item: NavItem
  onClose: () => void
  isMobile: boolean
}) {
  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
      }
      onClick={isMobile ? onClose : undefined}
    >
      <item.icon size={15} strokeWidth={1.75} className="sidebar__link-icon" />
      <span className="sidebar__link-label">{item.label}</span>
      {item.badge != null && item.badge > 0 && <Badge count={item.badge} />}
    </NavLink>
  )
}

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
interface SidebarProps {
  isOpen:   boolean
  isMobile: boolean
  onClose:  () => void
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const openAddTask = useModalStore((s) => s.openAddTask)

  const handleNewTask = () => {
    if (isMobile) onClose()
    openAddTask()
  }

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar__backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}
        aria-label="Main navigation"
      >
        <div className="sidebar__scroll">
          {/* New Task button */}
          <button className="sidebar__new-task" onClick={handleNewTask}>
            <Plus size={14} strokeWidth={2.25} />
            New Task
          </button>

          {SECTIONS.map((section) => (
            <div key={section.title} className="sidebar__section">
              <p className="sidebar__section-label">{section.title}</p>
              <nav>
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    onClose={onClose}
                    isMobile={isMobile}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
