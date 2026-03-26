import { Menu, X } from 'lucide-react'

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
        {/* Hamburger — visible only on mobile */}
        <button
          className="navbar__menu-btn"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <div className="navbar__logo">
          <span className="navbar__logo-mark">✦</span>
          <span className="navbar__logo-text">DayDo</span>
        </div>
      </div>

      <div className="navbar__right">
        {/* Date */}
        <span className="navbar__date">{today}</span>

        {/* Avatar */}
        <button className="navbar__avatar" aria-label="User menu">
          <span>M</span>
        </button>
      </div>
    </header>
  )
}
