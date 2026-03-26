import { create } from 'zustand'

interface CalendarState {
  /** ISO 'YYYY-MM-DD' of the selected day, or null = show all days */
  selectedDate: string | null
  setSelectedDate: (date: string | null) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
}))
