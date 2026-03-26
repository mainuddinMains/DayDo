import { create } from 'zustand'

interface ModalState {
  addTaskOpen: boolean
  openAddTask:  () => void
  closeAddTask: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  addTaskOpen:  false,
  openAddTask:  () => set({ addTaskOpen: true  }),
  closeAddTask: () => set({ addTaskOpen: false }),
}))
