import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, LogOut, User } from 'lucide-react'
import {
  useAuthStore,
  getDisplayName,
  getInitials,
  getAvatarUrl,
  getPreferences,
  type UserPreferences,
} from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import type { Priority } from '../types'

/* ── Toggle switch ──────────────────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked:  boolean
  onChange: (v: boolean) => void
  label:    string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`pref-toggle ${checked ? 'pref-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="pref-toggle__thumb" />
    </button>
  )
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const user          = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const signOut       = useAuthStore((s) => s.signOut)
  const authError     = useAuthStore((s) => s.error)
  const authLoading   = useAuthStore((s) => s.loading)
  const clearError    = useAuthStore((s) => s.clearError)

  const avatarUrl = getAvatarUrl(user)
  const initials  = getInitials(user)
  const prefs     = getPreferences(user)

  const [fullName,    setFullName]    = useState(
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '',
  )
  const [localPrefs,  setLocalPrefs]  = useState<UserPreferences>(prefs)
  const [justSaved,   setJustSaved]   = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  const setPref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    clearError()
    setLocalPrefs((p) => ({ ...p, [key]: value }))
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await updateProfile({ full_name: fullName, preferences: localPrefs })
    if (!useAuthStore.getState().error) {
      useToastStore.getState().show('Profile updated', 'success')
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2200)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
    { value: 'high', label: 'High' },
    { value: 'med',  label: 'Med'  },
    { value: 'low',  label: 'Low'  },
  ]

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={initials}
              className="profile-avatar__img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar__initials" aria-hidden="true">
              {initials || <User size={28} strokeWidth={1.5} />}
            </div>
          )}
        </div>
        <div className="profile-header__text">
          <h1 className="profile-name">{getDisplayName(user)}</h1>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      {/* ── Account + Preferences form ── */}
      <form onSubmit={handleSave}>

        {/* Account section */}
        <div className="profile-section">
          <h2 className="profile-section__title">Account</h2>

          <div className="form-field">
            <label className="form-label" htmlFor="pf-name">Display name</label>
            <input
              id="pf-name"
              className="form-input"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pf-email">Email</label>
            <input
              id="pf-email"
              className="form-input form-input--disabled"
              type="email"
              value={user?.email ?? ''}
              disabled
              aria-describedby="pf-email-note"
            />
            <span id="pf-email-note" className="form-hint">
              Email cannot be changed here.
            </span>
          </div>
        </div>

        {/* Preferences section */}
        <div className="profile-section">
          <h2 className="profile-section__title">Preferences</h2>

          {/* Default priority */}
          <div className="form-field">
            <span className="form-label" id="pf-priority-label">Default task priority</span>
            <div
              className="priority-group"
              role="group"
              aria-labelledby="pf-priority-label"
            >
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`priority-btn priority-btn--${value} ${
                    localPrefs.default_priority === value ? 'priority-btn--active' : ''
                  }`}
                  onClick={() => setPref('default_priority', value)}
                  aria-pressed={localPrefs.default_priority === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Week starts on */}
          <div className="form-field">
            <span className="form-label">Week starts on</span>
            <div className="pref-radio-group" role="radiogroup">
              {(['monday', 'sunday'] as const).map((day) => (
                <label key={day} className="pref-radio-label">
                  <input
                    type="radio"
                    name="week_starts"
                    className="pref-radio"
                    checked={localPrefs.week_starts_on === day}
                    onChange={() => setPref('week_starts_on', day)}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Focus mode */}
          <div className="pref-row">
            <div className="pref-row__info">
              <span className="pref-row__label">Focus mode</span>
              <span className="pref-row__desc">
                Dim low-priority tasks so high-impact work stands out
              </span>
            </div>
            <Toggle
              checked={localPrefs.focus_mode}
              onChange={(v) => setPref('focus_mode', v)}
              label="Focus mode"
            />
          </div>

          {/* Notifications */}
          <div className="pref-row">
            <div className="pref-row__info">
              <span className="pref-row__label">Email notifications</span>
              <span className="pref-row__desc">
                Receive task reminders and digests by email
              </span>
            </div>
            <Toggle
              checked={localPrefs.notifications}
              onChange={(v) => setPref('notifications', v)}
              label="Email notifications"
            />
          </div>
        </div>

        {/* Error / Save */}
        {authError && (
          <p className="auth-message auth-message--error" role="alert">
            {authError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={authLoading}
          style={{ marginBottom: 'var(--space-8)' }}
        >
          {authLoading && !signingOut && (
            <Loader2 size={14} className="spin" aria-hidden="true" />
          )}
          {justSaved && <CheckCircle2 size={14} aria-hidden="true" />}
          {justSaved ? 'Saved!' : 'Save changes'}
        </button>

      </form>

      {/* ── Danger zone ── */}
      <div className="profile-section profile-section--danger">
        <h2 className="profile-section__title">Session</h2>
        <p className="pref-row__desc" style={{ marginBottom: 'var(--space-4)' }}>
          You are signed in as <strong>{user?.email}</strong>.
          Signing out will clear your local session.
        </p>
        <button
          type="button"
          className="btn btn--danger"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut
            ? <Loader2 size={14} className="spin" aria-hidden="true" />
            : <LogOut   size={14} aria-hidden="true" />
          }
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

    </div>
  )
}
