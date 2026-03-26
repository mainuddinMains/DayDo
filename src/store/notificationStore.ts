import { create } from 'zustand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type NotifType =
  | 'task_added'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_deleted'

export interface Notification {
  id:        string
  type:      NotifType
  taskName:  string
  timestamp: string   // ISO datetime
  read:      boolean
}

interface NotificationState {
  notifications: Notification[]

  add:         (type: NotifType, taskName: string) => void
  dismiss:     (id: string) => void
  markAllRead: () => void
  clearAll:    () => void
}

const MAX_NOTIFICATIONS = 30

/* ── Store ──────────────────────────────────────────────────────────────────── */

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  add: (type, taskName) =>
    set((s) => {
      const next: Notification = {
        id:        crypto.randomUUID(),
        type,
        taskName,
        timestamp: new Date().toISOString(),
        read:      false,
      }
      const trimmed = [next, ...s.notifications].slice(0, MAX_NOTIFICATIONS)
      return { notifications: trimmed }
    }),

  dismiss: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),
}))
