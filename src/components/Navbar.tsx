import { Menu, X } from 'lucide-react'
import { useNavigate }    from 'react-router-dom'
import SearchBar          from './SearchBar'
import NotificationBell   from './NotificationBell'
import { useAuthStore, getDisplayName, getInitials, getAvatarUrl } from '../store/authStore'

/* ── Live user avatar ───────────────────────────────────────────────────────── */

function UserAvatar() {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const avatarUrl = getAvatarUrl(user)
  const initials  = getInitials(user)
  const name      = getDisplayName(user)

  return (
    <button
      className="navbar__avatar"
      onClick={() => navigate('/profile')}
      aria-label={`${name} — open profile`}
      title={name}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={initials}
          className="navbar__avatar-img"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">{initials || 'U'}</span>
      )}
    </button>
  )
}

/* ── Navbar ─────────────────────────────────────────────────────────────────── */

interface NavbarProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month:   'long',
  day:     'numeric',
}).format(new Date())

export default function Navbar({ onMenuClick, sidebarOpen }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button
          className="navbar__menu-btn"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="navbar__logo">
          <span className="navbar__logo-mark">✦</span>
          <span className="navbar__logo-text">DayDo</span>
        </div>
      </div>

      <div className="navbar__center">
        <SearchBar />
      </div>

      <div className="navbar__right">
        <span className="navbar__date">{today}</span>
        <NotificationBell />
        <UserAvatar />
      </div>
    </header>
  )
}
