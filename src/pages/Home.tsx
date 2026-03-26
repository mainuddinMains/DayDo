import StatsRow  from '../components/StatsRow'
import WeekStrip from '../components/WeekStrip'
import TaskList  from '../components/TaskList'

export default function Home() {
  return (
    <div>
      <h1 style={{ color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
        Today
      </h1>
      <p style={{ marginBottom: 'var(--space-6)' }}>
        {new Intl.DateTimeFormat('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        }).format(new Date())}
      </p>

      <StatsRow />
      <WeekStrip />
      <TaskList />
    </div>
  )
}
