import { useShallow } from 'zustand/react/shallow'
import { useTaskStore } from '../store/taskStore'
import type { Priority, Source } from '../types'

const todayISO = new Date().toISOString().slice(0, 10)  // 'YYYY-MM-DD'

/** All tasks, unfiltered */
export const useTasks = () => useTaskStore((s) => s.tasks)

/** Tasks after active filters are applied */
export const useFilteredTasks = () => {
  const tasks   = useTaskStore((s) => s.tasks)
  const filters = useTaskStore((s) => s.filters)
  return tasks.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.source   && t.source   !== filters.source)   return false
    return true
  })
}

/** Current filter state */
export const useTaskFilters = () => useTaskStore(useShallow((s) => s.filters))

/** Mutation actions */
export const useTaskActions = () =>
  useTaskStore(useShallow((s) => ({
    addTask:          s.addTask,
    toggleTask:       s.toggleTask,
    deleteTask:       s.deleteTask,
    filterByPriority: s.filterByPriority,
    filterBySource:   s.filterBySource,
    clearFilters:     s.clearFilters,
  })))

/** All counts needed by the stats row */
export const useStatsRow = () => {
  const tasks       = useTaskStore((s) => s.tasks)
  const focusStreak = useTaskStore((s) => s.focusStreak)
  const total    = tasks.length
  const done     = tasks.filter((t) => t.done).length
  const dueToday = tasks.filter((t) => t.dueDate === todayISO).length
  const meetings = tasks.filter((t) => t.tags.includes('meeting')).length
  return {
    total,
    done,
    pending:     total - done,
    pct:         total === 0 ? 0 : Math.round((done / total) * 100),
    dueToday,
    meetings,
    focusStreak,
  }
}

/** Granular count helpers */
export const useTaskCounts = () => {
  const tasks = useTaskStore((s) => s.tasks)
  return {
    total:      tasks.length,
    done:       tasks.filter((t) => t.done).length,
    pending:    tasks.filter((t) => !t.done).length,
    high:       tasks.filter((t) => t.priority === 'high' && !t.done).length,
    bySource:   (source: Source) => tasks.filter((t) => t.source   === source && !t.done).length,
    byPriority: (p: Priority)    => tasks.filter((t) => t.priority === p      && !t.done).length,
  }
}
