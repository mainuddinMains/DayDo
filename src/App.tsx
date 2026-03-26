import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </AppShell>
  )
}

export default App
