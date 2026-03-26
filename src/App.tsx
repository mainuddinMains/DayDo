import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell    from './components/AppShell'
import Home        from './pages/Home'
import LoginPage   from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { useAuthStore } from './store/authStore'

/* ── Full-screen loader shown while restoring the stored session ─────────────── */

function AppLoader() {
  return (
    <div className="app-loader">
      <span className="app-loader__mark" aria-label="Loading">✦</span>
    </div>
  )
}

/* ── Root component ─────────────────────────────────────────────────────────── */

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const loading    = useAuthStore((s) => s.loading)
  const session    = useAuthStore((s) => s.session)

  useEffect(() => { initialize() }, [initialize])

  if (loading) return <AppLoader />

  /* Unauthenticated — all routes show the login page */
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  /* Authenticated — normal app shell with route tree */
  return (
    <AppShell>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*"        element={<Home />} />
      </Routes>
    </AppShell>
  )
}
