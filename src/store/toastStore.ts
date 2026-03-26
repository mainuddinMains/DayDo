import { create } from 'zustand'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id:      string
  message: string
  type:    ToastType
}

interface ToastState {
  toasts: Toast[]
  show:   (message: string, type?: ToastType) => void
  dismiss:(id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500,
    )
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Convenience hook — returns only the `show` action */
export const useToast = () => useToastStore((s) => s.show)
