import { Plug, Loader2 } from 'lucide-react'
import { useTaskStore }          from '../store/taskStore'
import { useToast }              from '../store/toastStore'
import type { IntegrationStatus } from '../store/taskStore'

/* ── App config ────────────────────────────────────────────────────────────── */

interface AppConfig {
  id:          string
  name:        string
  initial:     string   // letter shown in the icon badge
  color:       string   // brand foreground / border
  bg:          string   // icon badge background tint
  /** 'live' = reads from store; true/false = hardcoded */
  connected:   boolean | 'google' | 'slack'
  description: string   // shown as sub-label
  onConnect?:  () => void
}

const APPS: Omit<AppConfig, 'onConnect'>[] = [
  {
    id:          'google-tasks',
    name:        'Google Tasks',
    initial:     'G',
    color:       '#4285f4',
    bg:          'rgba(66, 133, 244, 0.12)',
    connected:   'google',
    description: 'Tasks · Lists',
  },
  {
    id:          'slack',
    name:        'Slack',
    initial:     'S',
    color:       '#e01e5a',
    bg:          'rgba(224, 30, 90, 0.12)',
    connected:   'slack',
    description: 'Messages · Channels',
  },
  {
    id:          'notion',
    name:        'Notion',
    initial:     'N',
    color:       '#a0a0a0',
    bg:          'rgba(160, 160, 160, 0.10)',
    connected:   false,
    description: 'Docs · Databases',
  },
  {
    id:          'jira',
    name:        'Jira',
    initial:     'J',
    color:       '#0052cc',
    bg:          'rgba(0, 82, 204, 0.12)',
    connected:   false,
    description: 'Issues · Sprints',
  },
]

/* ── Count selector — live from the task store ─────────────────────────────── */

const SOURCE_MAP: Record<string, string> = {
  'google-tasks': 'Google Tasks',
  'slack':        'Slack',
  'notion':       'Notion',
  'jira':         'Jira',
}

function useAppCount(appId: string): number {
  return useTaskStore((s) =>
    s.tasks.filter((t) => t.source === SOURCE_MAP[appId] && !t.done).length
  )
}

/* ── App row ───────────────────────────────────────────────────────────────── */

interface AppRowProps {
  app:       Omit<AppConfig, 'onConnect'>
  status:    IntegrationStatus
  onConnect: () => void
}

function AppRow({ app, status, onConnect }: AppRowProps) {
  const count     = useAppCount(app.id)
  const showToast = useToast()

  const isLive      = app.connected === 'google' || app.connected === 'slack'
  const isConnected = isLive
    ? (status === 'connected' || status === 'loading')
    : app.connected === true
  const isLoading   = isLive && (status === 'connecting' || status === 'loading')
  const isError     = isLive && status === 'error'

  const handleConnect = () => {
    if (isLive) {
      onConnect()
    } else {
      showToast(`${app.name} integration coming soon`, 'info')
    }
  }

  return (
    <div className={`app-row ${isError ? 'app-row--error' : ''}`}>
      {/* Icon badge */}
      <div
        className="app-row__icon"
        style={{ background: app.bg, color: app.color }}
        aria-hidden="true"
      >
        {app.initial}
      </div>

      {/* Name + description */}
      <div className="app-row__info">
        <span className="app-row__name">{app.name}</span>
        <span className="app-row__desc">
          {isError ? <span className="app-row__error-label">Connection error</span> : app.description}
        </span>
      </div>

      {/* Right side — count + status OR connect button */}
      <div className="app-row__end">
        {isLoading ? (
          <Loader2 size={14} className="app-row__spinner" aria-label="Syncing" />
        ) : isConnected ? (
          <>
            {count > 0 && (
              <span
                className="app-row__count"
                style={{ color: app.color, background: app.bg }}
              >
                {count}
              </span>
            )}
            <span className="app-row__status" title="Connected">
              <span className="app-row__dot" aria-label="Connected" />
            </span>
          </>
        ) : (
          <button
            type="button"
            className="app-row__connect-btn"
            onClick={handleConnect}
            aria-label={`Connect ${app.name}`}
          >
            <Plug size={11} strokeWidth={2} />
            {isError ? 'Retry' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */

interface ConnectedAppsProps {
  onGoogleConnect: () => void
  onSlackConnect:  () => void
}

export default function ConnectedApps({ onGoogleConnect, onSlackConnect }: ConnectedAppsProps) {
  const googleStatus = useTaskStore((s) => s.googleStatus)
  const slackStatus  = useTaskStore((s) => s.slackStatus)

  const statusFor = (app: Omit<AppConfig, 'onConnect'>): IntegrationStatus => {
    if (app.connected === 'google') return googleStatus
    if (app.connected === 'slack')  return slackStatus
    return app.connected ? 'connected' : 'idle'
  }

  const connectFor = (app: Omit<AppConfig, 'onConnect'>) => {
    if (app.connected === 'google') return onGoogleConnect
    if (app.connected === 'slack')  return onSlackConnect
    return () => {}
  }

  const connectedCount = APPS.filter((a) => {
    const s = statusFor(a)
    return s === 'connected' || s === 'loading' || a.connected === true
  }).length

  return (
    <div className="connected-apps">
      {/* Header */}
      <div className="connected-apps__header">
        <h2 className="connected-apps__title">Integrations</h2>
        <span className="connected-apps__meta">
          {connectedCount} / {APPS.length} connected
        </span>
      </div>

      {/* App rows */}
      <div className="connected-apps__list">
        {APPS.map((app) => (
          <AppRow
            key={app.id}
            app={app}
            status={statusFor(app)}
            onConnect={connectFor(app)}
          />
        ))}
      </div>
    </div>
  )
}
